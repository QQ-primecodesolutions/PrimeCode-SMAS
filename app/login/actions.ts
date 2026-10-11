"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { clientIp, lockoutMessage, lockoutState } from "@/lib/auth/lockout";
import { passwordMatches, safeNext, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const config = authConfig();
  if (config.mode === "off") redirect(safeNext(formData.get("next")));
  if (config.mode === "misconfigured") {
    console.error("[auth] login unavailable:", config.problem);
    return { error: "Login isn't set up on this server yet. Check the environment variables, then redeploy." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: "Enter the password." };

  const ip = clientIp(await headers());
  const now = new Date();
  let failures: { ipFailures: Date[]; globalFailures: number };
  try {
    failures = await config.store.read(ip, now);
  } catch (e) {
    // Fail closed: without the lockout counts, don't allow guessing.
    console.error("[auth] lockout store unavailable:", e instanceof Error ? e.message : e);
    return { error: "Login is unavailable right now. Try again in a few minutes." };
  }

  const before = lockoutState(failures.ipFailures, failures.globalFailures, now);
  if (before.blocked) return { error: lockoutMessage(before) };

  if (!passwordMatches(password, config.password, config.secret)) {
    await config.store.recordFailure(ip, now);
    const after = lockoutState([now, ...failures.ipFailures], failures.globalFailures + 1, now);
    if (after.blocked) return { error: lockoutMessage(after) };
    return {
      error: `Wrong password. ${after.attemptsLeft} attempt${after.attemptsLeft === 1 ? "" : "s"} left before a 15-minute lockout.`,
    };
  }

  await config.store.clear(ip);
  (await cookies()).set(SESSION_COOKIE, signSession(config.secret, now), sessionCookieOptions());
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/" });
  redirect("/login");
}
