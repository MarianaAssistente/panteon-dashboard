import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// Rate limiting: Map<ip, { count, lockedUntil }>
const rateLimitMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function signToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const tokenData = encoder.encode(token);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, tokenData);
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();

  // Rate limiting check
  const rateEntry = rateLimitMap.get(ip);
  if (rateEntry) {
    if (rateEntry.lockedUntil > now) {
      const remaining = Math.ceil((rateEntry.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: "Acesso temporariamente bloqueado." },
        { status: 429, headers: { "Retry-After": String(remaining * 60) } }
      );
    }
    // Lockout expired — reset
    if (rateEntry.lockedUntil > 0 && rateEntry.lockedUntil <= now) {
      rateLimitMap.delete(ip);
    }
  }

  try {
    const body = await request.json();
    const password = (body.password ?? "").trim();
    const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

    if (!adminPassword) {
      return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
    }

    // Timing-safe comparison (prevents timing attacks)
    const passwordBuffer = Buffer.from(password);
    const expectedBuffer = Buffer.from(adminPassword);

    let passwordMatch = false;
    if (passwordBuffer.length === expectedBuffer.length) {
      try {
        passwordMatch = crypto.timingSafeEqual(passwordBuffer, expectedBuffer);
      } catch {
        passwordMatch = false;
      }
    }

    if (!passwordMatch) {
      // Increment failed attempts
      const entry = rateLimitMap.get(ip) ?? { count: 0, lockedUntil: 0 };
      entry.count += 1;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_MS;
      }
      rateLimitMap.set(ip, entry);

      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Success — clear rate limit for this IP
    rateLimitMap.delete(ip);

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Sign with AUTH_SECRET using Web Crypto API (same as middleware)
    const authSecret = process.env.AUTH_SECRET ?? "fallback-secret";
    const sessionSig = await signToken(sessionToken, authSecret);

    const response = NextResponse.json({ ok: true });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    };

    response.cookies.set("session", sessionToken, cookieOpts);
    response.cookies.set("session_sig", sessionSig, cookieOpts);

    return response;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}
