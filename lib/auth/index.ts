/**
 * The security boundary for pages and routes. proxy.ts redirects signed-out visitors early, but
 * every page, route and Server Action also checks here (Next.js: never rely on Proxy alone).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "./config";
import { SESSION_COOKIE, verifySession } from "./session";

export async function isSignedIn(): Promise<boolean> {
  const config = authConfig();
  if (config.mode === "off") return true;
  if (config.mode === "misconfigured") return false;
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, config.secret);
}

/** For pages: sends signed-out visitors to the login page, then back to `path`. */
export async function requireSignedIn(path: string): Promise<void> {
  if (!(await isSignedIn())) redirect(`/login?next=${encodeURIComponent(path)}`);
}
