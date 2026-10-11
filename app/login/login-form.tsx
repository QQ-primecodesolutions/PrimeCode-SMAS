"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full rounded border border-border bg-white px-3 py-2 focus:border-primary focus:outline-none"
        />
      </label>
      {state.error ? (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
