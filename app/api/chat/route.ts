import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const RELAY_URL = process.env.RELAY_URL;
  const RELAY_SECRET = process.env.RELAY_SECRET;

  if (!RELAY_URL || !RELAY_SECRET) {
    return new Response(JSON.stringify({ error: "Relay not configured" }), { status: 503 });
  }

  const upstream = await fetch(RELAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Relay-Secret": RELAY_SECRET,
    },
    body: JSON.stringify({
      messages,
      stream: true,
      user: "dashboard-chat",
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(JSON.stringify({ error: err }), { status: upstream.status });
  }

  // Stream SSE direto para o browser
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
