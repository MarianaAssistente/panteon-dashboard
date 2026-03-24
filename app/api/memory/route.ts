import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WORKSPACE = "/home/ceo-mariana/.openclaw/workspace";
const VALID_AGENTS = ["mariana","atena","hefesto","apollo","afrodite","hera","ares","hestia"];

function buildPath(agent: string, file: string): string | null {
  if (agent === "shared") return `${WORKSPACE}/shared/memory/${file}`;
  if (VALID_AGENTS.includes(agent)) return `${WORKSPACE}/${agent}/memory/${file}`;
  return null;
}

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
      title: `Memory ${code}`,
      content: JSON.stringify(content),
      category: "sistema",
      tags: ["memory"],
      importance: "alto",
    }),
    cache: "no-store",
  });
}

async function sbGet(code: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge?code=eq.${code}&select=content`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store",
    }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return null;
  try { return JSON.parse(rows[0].content); } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent") || "";
  const file = searchParams.get("file") || "";

  if (!agent || !file) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  const filePath = buildPath(agent, file);
  if (!filePath) return NextResponse.json({ error: "Agente inválido" }, { status: 400 });

  const requestId = `mem-read-${Date.now()}`;

  // Limpar output anterior e enviar comando de leitura
  await sbUpsert("MEM-OUT", { content: null, exists: null, request_id: "", ts: 0 });
  await sbUpsert("MEM-CMD", { cmd: "readfile", path: filePath, request_id: requestId, ts: Date.now() / 1000 });

  // Aguardar resposta do worker no VPS (até 10s)
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 400));
    const result = await sbGet("MEM-OUT") as any;
    if (result && result.request_id === requestId) {
      return NextResponse.json({ content: result.content || "", exists: result.exists ?? false });
    }
  }
  return NextResponse.json({ error: "Timeout ao ler arquivo" }, { status: 504 });
}

export async function POST(req: Request) {
  const { agent, file, content } = await req.json();
  if (!agent || !file || content === undefined) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const filePath = buildPath(agent, file);
  if (!filePath) return NextResponse.json({ error: "Agente inválido" }, { status: 400 });

  const requestId = `mem-write-${Date.now()}`;

  await sbUpsert("MEM-WRITE-OUT", { ok: null, request_id: "", ts: 0 });
  await sbUpsert("MEM-WRITE-CMD", { cmd: "writefile", path: filePath, content, request_id: requestId, ts: Date.now() / 1000 });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 400));
    const result = await sbGet("MEM-WRITE-OUT") as any;
    if (result && result.request_id === requestId) {
      return NextResponse.json({ ok: result.ok ?? false });
    }
  }
  return NextResponse.json({ error: "Timeout ao salvar arquivo" }, { status: 504 });
}
