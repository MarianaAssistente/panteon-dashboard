import { NextResponse } from "next/server";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET() {
  const RELAY_URL = process.env.RELAY_URL ?? "NOT_SET";
  const RELAY_SECRET = process.env.RELAY_SECRET ? "SET" : "NOT_SET";
  let reachable = false; let error = ""; let status = 0;
  try {
    const healthUrl = RELAY_URL.replace("/chat", "/health");
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(8000) });
    status = res.status; reachable = res.ok;
  } catch (e: any) { error = e.message; }
  return NextResponse.json({ RELAY_URL, RELAY_SECRET, reachable, status, error });
}
