import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * Early redirect for signed-out visitors. A convenience, not the security boundary: pages and
 * the render route check again with lib/auth (Next.js runs Proxy separately from render code).
 */
export function proxy(request: NextRequest) {
  const config = authConfig();
  if (config.mode === "off") return NextResponse.next();
  if (config.mode === "on" && verifySession(request.cookies.get(SESSION_COOKIE)?.value, config.secret)) {
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  // Images can't follow a redirect to a login page; answer them plainly.
  if (pathname.startsWith("/render/")) return new NextResponse("Sign in first.", { status: 401 });
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page itself and Next's static files.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
