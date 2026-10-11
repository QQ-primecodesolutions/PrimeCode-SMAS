import type { Metadata } from "next";
import { safeNext } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · PrimeCode Studio", robots: { index: false, follow: false } };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  return (
    <main className="mx-auto mt-24 max-w-sm p-6">
      <h1 className="mb-1 text-2xl font-bold">PrimeCode Studio</h1>
      <p className="mb-6 text-sm text-text-secondary">Drafts and client work in progress. Founder access only.</p>
      <LoginForm next={safeNext(next)} />
    </main>
  );
}
