/**
 * The founder's session: an HMAC-SHA256-signed token in an httpOnly cookie. No library: the
 * token is base64url(JSON payload) + "." + base64url(signature), checked in constant time.
 * Signed with AUTH_SECRET, so changing the secret signs everyone out; changing only the
 * password doesn't. Free of Next.js imports so proxy.ts, Server Actions and tests can share it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "pcs_session";
export const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days, fixed (not sliding)

type Payload = { sub: "founder"; exp: number };

const b64 = (data: Buffer | string) => Buffer.from(data).toString("base64url");
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest();

export function signSession(secret: string, now = new Date()): string {
  const payload: Payload = { sub: "founder", exp: Math.floor(now.getTime() / 1000) + SESSION_MAX_AGE_SECONDS };
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(sign(body, secret))}`;
}

/** True for a well-formed, correctly signed, unexpired token. */
export function verifySession(token: string | undefined, secret: string, now = new Date()): boolean {
  if (!token) return false;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return false;
  const expected = sign(body, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<Payload>;
    return payload.sub === "founder" && typeof payload.exp === "number" && payload.exp * 1000 > now.getTime();
  } catch {
    return false;
  }
}

/** Constant-time password check (compares fixed-length digests, so length doesn't leak either). */
export function passwordMatches(given: string, expected: string, secret: string): boolean {
  const digest = (s: string) => createHmac("sha256", secret).update(s, "utf8").digest();
  return timingSafeEqual(digest(given), digest(expected));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Only same-site paths, so the login page can't be used to redirect elsewhere. No whitespace,
 * control characters or backslashes either: a CR in a Location header makes Node throw.
 */
export function safeNext(next: unknown): string {
  if (typeof next !== "string" || next.length > 512) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return /[\s\\\x00-\x1f\x7f]/.test(next) ? "/" : next;
}
