/**
 * Where failed logins are counted. Production uses Upstash Redis (from the Vercel Marketplace)
 * through its REST API with plain fetch, so there's no SDK dependency. Each IP's failures are a
 * sorted set of timestamps; all failures together are another. Keys expire after the window.
 */
import { WINDOW_MS } from "./lockout";

export interface FailureStore {
  /** This IP's failures within the window, and the count across all IPs. */
  read(ip: string, now: Date): Promise<{ ipFailures: Date[]; globalFailures: number }>;
  recordFailure(ip: string, now: Date): Promise<void>;
  clear(ip: string): Promise<void>;
}

const ipKey = (ip: string) => `pcs:login:fail:${ip}`;
const GLOBAL_KEY = "pcs:login:fail:all";
const TTL_SECONDS = Math.ceil(WINDOW_MS / 1000);

type Command = (string | number)[];

export function upstashStore(url: string, token: string, fetchImpl: typeof fetch = fetch): FailureStore {
  async function pipeline(commands: Command[]): Promise<unknown[]> {
    const res = await fetchImpl(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash returned ${res.status}`);
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    const failed = out.find((r) => r.error);
    if (failed) throw new Error(`Upstash error: ${failed.error}`);
    return out.map((r) => r.result);
  }

  return {
    async read(ip, now) {
      const since = now.getTime() - WINDOW_MS;
      const [ipScores, global] = await pipeline([
        ["ZRANGE", ipKey(ip), since, "+inf", "BYSCORE", "WITHSCORES"],
        ["ZCOUNT", GLOBAL_KEY, since, "+inf"],
      ]);
      // WITHSCORES returns [member, score, member, score, …].
      const scores = (ipScores as string[]).filter((_, i) => i % 2 === 1).map((s) => new Date(Number(s)));
      return { ipFailures: scores, globalFailures: Number(global) };
    },
    async recordFailure(ip, now) {
      const t = now.getTime();
      const member = `${t}-${Math.random().toString(36).slice(2, 8)}`;
      await pipeline([
        ["ZADD", ipKey(ip), t, member],
        ["ZREMRANGEBYSCORE", ipKey(ip), "-inf", t - WINDOW_MS],
        ["EXPIRE", ipKey(ip), TTL_SECONDS],
        ["ZADD", GLOBAL_KEY, t, `${member}-${ip}`],
        ["ZREMRANGEBYSCORE", GLOBAL_KEY, "-inf", t - WINDOW_MS],
        ["EXPIRE", GLOBAL_KEY, TTL_SECONDS],
      ]);
    },
    async clear(ip) {
      await pipeline([["DEL", ipKey(ip)]]);
    },
  };
}

/** For local development and tests only: one process, forgotten on restart. */
export function memoryStore(): FailureStore {
  const byIp = new Map<string, number[]>();
  const all: number[] = [];
  const recent = (list: number[], now: Date) => list.filter((t) => now.getTime() - t < WINDOW_MS);
  return {
    async read(ip, now) {
      return { ipFailures: recent(byIp.get(ip) ?? [], now).map((t) => new Date(t)), globalFailures: recent(all, now).length };
    },
    async recordFailure(ip, now) {
      byIp.set(ip, [...recent(byIp.get(ip) ?? [], now), now.getTime()]);
      all.push(now.getTime());
    },
    async clear(ip) {
      byIp.delete(ip);
    },
  };
}
