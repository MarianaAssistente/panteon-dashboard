import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ALLOWED = [
  "status","crons","logs-relay","logs-metrics",
  "ps-agents","disk","memory","uptime","network","log-today"
];

async function sbUpsert(code: string, content: object) {
  await fetch(`${SUPABASE_URL}/rest/v1/knowledge?on_conflict=code`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      code,
      title: `Terminal ${code}`,
      content: JSON.stringify(content),
      category: "sistema",
      tags: ["terminal"],
      importance: "alto",
    }),
    cache: "no-store",
  });
}

async function sbGet(code: string): Promise<object | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge?code=eq.${code}&select=content`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store",
    }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return null;
  return JSON.parse(rows[0].content);
}

export async function POST(request: Request) {
  const { command } = await request.json();

  if (!command || !ALLOWED.includes(command)) {
    return NextResponse.json({ error: "Comando não permitido." }, { status: 403 });
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ts = Date.now() / 1000;

  // 1. Limpar resultado anterior
  await sbUpsert("TERM-OUT", { output: "", request_id: "", ts: 0 });

  // 2. Enviar comando
  await sbUpsert("TERM-CMD", { cmd: command, request_id: requestId, ts });

  // 3. Polling por resultado (max 12s, poll a cada 500ms)
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    const result = await sbGet("TERM-OUT") as any;
    if (result && result.request_id === requestId && result.output) {
      return NextResponse.json({
        output: result.output,
        command,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ error: "Timeout: VPS não respondeu em 12s." }, { status: 504 });
}
