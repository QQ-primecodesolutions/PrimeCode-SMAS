import { describe, expect, it } from "vitest";
import { authConfig } from "@/lib/auth/config";
import { clientIp, LOCKOUT, lockoutMessage, lockoutState } from "@/lib/auth/lockout";
import { passwordMatches, safeNext, signSession, verifySession, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { memoryStore, upstashStore } from "@/lib/auth/store";

const SECRET = "s".repeat(40);
const now = new Date("2026-10-20T08:00:00Z");
const minutes = (n: number) => new Date(now.getTime() - n * 60_000);

describe("session", () => {
  it("verifies its own token and rejects tampered, foreign or expired ones", () => {
    const token = signSession(SECRET, now);
    expect(verifySession(token, SECRET, now)).toBe(true);
    expect(verifySession(token, "x".repeat(40), now)).toBe(false); // a new AUTH_SECRET signs everyone out
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "founder", exp: 9e9 })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, SECRET, now)).toBe(false);
    expect(verifySession(`${body}.${sig}.x`, SECRET, now)).toBe(false);
    expect(verifySession(undefined, SECRET, now)).toBe(false);
    const later = new Date(now.getTime() + (SESSION_MAX_AGE_SECONDS + 1) * 1000);
    expect(verifySession(token, SECRET, later)).toBe(false);
  });

  it("compares passwords exactly", () => {
    expect(passwordMatches("river stone lamp kettle", "river stone lamp kettle", SECRET)).toBe(true);
    expect(passwordMatches("river stone lamp", "river stone lamp kettle", SECRET)).toBe(false);
  });

  it("only redirects to same-site paths after login", () => {
    expect(safeNext("/post/PC-2026-001?size=story")).toBe("/post/PC-2026-001?size=story");
    const bad = ["https://evil.example", "//evil.example", "/\\evil.example", "/post\r\nSet-Cookie: x", "/a b", null, 3];
    for (const next of bad) expect(safeNext(next)).toBe("/");
  });
});

describe("lockout", () => {
  it("blocks an IP after five failures in 15 minutes, until the oldest ages out", () => {
    expect(lockoutState([minutes(1), minutes(2)], 2, now)).toEqual({ blocked: false, attemptsLeft: 3 });
    const five = [minutes(1), minutes(2), minutes(3), minutes(4), minutes(10)];
    const state = lockoutState(five, 5, now);
    expect(state).toEqual({ blocked: true, reason: "ip", retryAfterMinutes: 5 });
    if (state.blocked) expect(lockoutMessage(state)).toMatch(/Try again in 5 minutes/);
    // Failures older than the window don't count.
    expect(lockoutState([minutes(16), minutes(20)], 0, now).blocked).toBe(false);
  });

  it("pauses everyone when many networks fail together", () => {
    expect(lockoutState([], LOCKOUT.global, now)).toMatchObject({ blocked: true, reason: "global" });
  });

  it("reads the platform's client IP headers", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("failure stores", () => {
  it("memory store counts per IP and clears on success", async () => {
    const store = memoryStore();
    await store.recordFailure("a", minutes(2));
    await store.recordFailure("a", minutes(1));
    await store.recordFailure("b", minutes(1));
    expect((await store.read("a", now)).ipFailures).toHaveLength(2);
    expect((await store.read("a", now)).globalFailures).toBe(3);
    await store.clear("a");
    expect((await store.read("a", now)).ipFailures).toHaveLength(0);
  });

  it("upstash store sends one pipeline per call and parses scores", async () => {
    const calls: { url: string; body: unknown; auth: string | null }[] = [];
    const t1 = minutes(3).getTime();
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(init.body as string), auth: new Headers(init.headers).get("authorization") });
      const body = JSON.parse(init.body as string) as unknown[][];
      const result = body[0]![0] === "ZRANGE" ? [{ result: ["m1", String(t1)] }, { result: 4 }] : body.map(() => ({ result: 1 }));
      return new Response(JSON.stringify(result));
    }) as unknown as typeof fetch;

    const store = upstashStore("https://example.upstash.io/", "tok", fakeFetch);
    const read = await store.read("1.2.3.4", now);
    expect(read).toEqual({ ipFailures: [new Date(t1)], globalFailures: 4 });
    await store.recordFailure("1.2.3.4", now);
    expect(calls[0]!.url).toBe("https://example.upstash.io/pipeline");
    expect(calls[0]!.auth).toBe("Bearer tok");
    expect((calls[1]!.body as unknown[][]).map((c) => c[0])).toEqual([
      "ZADD",
      "ZREMRANGEBYSCORE",
      "EXPIRE",
      "ZADD",
      "ZREMRANGEBYSCORE",
      "EXPIRE",
    ]);
  });

  it("upstash store fails loudly so login fails closed", async () => {
    const down = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
    await expect(upstashStore("https://x", "t", down).read("a", now)).rejects.toThrow(/500/);
  });
});

describe("authConfig", () => {
  const good = { AUTH_SECRET: SECRET, ADMIN_PASSWORD: "river stone lamp kettle" };

  it("leaves local development open until AUTH_SECRET is set", () => {
    expect(authConfig({ NODE_ENV: "development" }).mode).toBe("off");
    expect(authConfig({ NODE_ENV: "development", ...good }).mode).toBe("on");
  });

  it("never runs production open or with in-memory lockout counts", () => {
    expect(authConfig({ NODE_ENV: "production" })).toMatchObject({ mode: "misconfigured" });
    expect(authConfig({ NODE_ENV: "production", ...good })).toMatchObject({
      mode: "misconfigured",
      problem: expect.stringMatching(/Redis/),
    });
    expect(authConfig({ NODE_ENV: "production", ...good, KV_REST_API_URL: "https://x", KV_REST_API_TOKEN: "t" }).mode).toBe("on");
  });

  it("refuses weak secrets and short passwords", () => {
    expect(authConfig({ NODE_ENV: "production", AUTH_SECRET: "short", ADMIN_PASSWORD: good.ADMIN_PASSWORD }).mode).toBe(
      "misconfigured",
    );
    expect(authConfig({ NODE_ENV: "production", AUTH_SECRET: SECRET, ADMIN_PASSWORD: "Name@2026" }).mode).toBe("misconfigured");
  });
});
