import { NextResponse } from "next/server";

const METRICS_URL = "http://127.0.0.1:3098/metrics";
const METRICS_SECRET = process.env.METRICS_SECRET ?? "olimpo-metrics-2026";

let cache: { data: unknown; ts: number } | null = null;
const CACHE_MS = 3000;

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data);
  }
  try {
    const res = await fetch(METRICS_URL, {
      headers: { "X-Metrics-Secret": METRICS_SECRET },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("metrics unavailable");
    const data = await res.json();
    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
  }
}
