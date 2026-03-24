import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifySession(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get("session")?.value;
  const sessionSig = request.cookies.get("session_sig")?.value;

  if (!sessionToken || !sessionSig) return false;

  const authSecret = process.env.AUTH_SECRET ?? "";
  if (!authSecret) return false;

  try {
    // Use Web Crypto API (available in Edge Runtime)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const tokenData = encoder.encode(sessionToken);
    const sigBytes = hexToBytes(sessionSig);

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, tokenData);
    return isValid;
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function middleware(request: NextRequest) {
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
  const valid = await verifySession(request);
  if (valid) {
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
