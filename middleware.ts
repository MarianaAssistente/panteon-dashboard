import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

function verifySession(request: NextRequest): boolean {
  const sessionToken = request.cookies.get("session")?.value;
  const sessionSig = request.cookies.get("session_sig")?.value;

  if (!sessionToken || !sessionSig) return false;

  const authSecret = process.env.AUTH_SECRET ?? "";
  if (!authSecret) return false;

  // Verify the signature matches the token (prevents cookie tampering)
  try {
    const expectedSig = crypto
      .createHmac("sha256", authSecret)
      .update(sessionToken)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSig, "hex");
    const providedBuf = Buffer.from(sessionSig, "hex");

    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, login page, and auth API routes
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Verify session cookie
  if (verifySession(request)) {
    return NextResponse.next();
  }

  // No valid session — redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
