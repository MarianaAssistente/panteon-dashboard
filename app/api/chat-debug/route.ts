import { NextResponse } from "next/server";

export async function GET() {
  const RELAY_URL = process.env.RELAY_URL ?? "NOT_SET";
  const RELAY_SECRET = process.env.RELAY_SECRET ?? "";
  let reachable = false; let error = ""; let status = 0;
  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Secret": RELAY_SECRET },
      body: JSON.stringify({ messages: [{ role: "user", content: "ping" }], stream: false }),
      // @ts-ignore
      signal: AbortSignal.timeout(10000),
    });
    status = res.status; reachable = res.ok;
  } catch (e: any) { error = e.message; }
  return NextResponse.json({ RELAY_URL, RELAY_SECRET: RELAY_SECRET ? "SET" : "NOT_SET", reachable, status, error });
}
