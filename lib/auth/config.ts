/**
 * Auth settings from the environment (Vercel env vars, or .env.local). Never from git.
 *
 * - AUTH_SECRET: 32+ random characters; signs the session cookie.
 * - ADMIN_PASSWORD: the founder's passphrase (3–4 random words, 16+ characters).
 * - KV_REST_API_URL / KV_REST_API_TOKEN (set by the Upstash for Redis integration on Vercel), or
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN: where failed logins are counted.
 *
 * Login is required in production, and locally once AUTH_SECRET is set. With no AUTH_SECRET in
 * development the studio stays open, as the local tool it started as. Production never falls back
 * to open access or to in-memory lockout counts: missing settings mean nobody can log in.
 */
import { type FailureStore, memoryStore, upstashStore } from "./store";

export type AuthConfig =
  | { mode: "off" }
  | { mode: "on"; secret: string; password: string; store: FailureStore }
  | { mode: "misconfigured"; problem: string };

let devStore: FailureStore | null = null;

export function authConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const production = env.NODE_ENV === "production";
  const secret = env.AUTH_SECRET;
  if (!secret && !production) return { mode: "off" };
  if (!secret || secret.length < 32) return { mode: "misconfigured", problem: "AUTH_SECRET must be set to 32+ random characters." };
  const password = env.ADMIN_PASSWORD;
  if (!password || password.length < 16)
    return { mode: "misconfigured", problem: "ADMIN_PASSWORD must be a passphrase of 16+ characters (3–4 random words)." };

  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { mode: "on", secret, password, store: upstashStore(url, token) };
  if (production)
    return {
      mode: "misconfigured",
      problem: "Login lockout needs Redis: connect Upstash for Redis in Vercel (sets KV_REST_API_URL and KV_REST_API_TOKEN).",
    };
  devStore ??= memoryStore();
  return { mode: "on", secret, password, store: devStore };
}
