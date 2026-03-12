import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/chat") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const expected = (process.env.DASHBOARD_PASSWORD ?? "").trim();
  const auth = (request.cookies.get("panteon_auth")?.value ?? "").trim();

  if (expected && auth === expected) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
