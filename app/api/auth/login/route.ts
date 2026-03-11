import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "";
const COOKIE_NAME = "panteon_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Password not configured" }, { status: 500 });
  }

  if (password !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, DASHBOARD_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
