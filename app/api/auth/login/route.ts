import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = (body.password ?? "").trim();
    const expected = (process.env.DASHBOARD_PASSWORD ?? "").trim();

    if (!expected) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    if (password !== expected) {
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("panteon_auth", expected, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
