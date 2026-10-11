import { authConfig } from "@/lib/auth/config";
import { logout } from "./login/actions";

/** Shown only when login is on (not in open local development). */
export function LogoutButton() {
  if (authConfig().mode === "off") return null;
  return (
    <form action={logout}>
      <button type="submit" className="text-sm text-text-secondary hover:text-primary hover:underline">
        Log out
      </button>
    </form>
  );
}
