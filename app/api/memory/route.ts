import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const RELAY_URL = process.env.RELAY_URL!;
const RELAY_SECRET = process.env.RELAY_SECRET!;
const WORKSPACE = "/home/ceo-mariana/.openclaw/workspace";

const VALID_AGENTS = ["mariana","atena","hefesto","apollo","afrodite","hera","ares","hestia"];

function buildPath(agent: string, file: string): string | null {
  if (agent === "shared") return `${WORKSPACE}/shared/memory/${file}`;
  if (VALID_AGENTS.includes(agent)) return `${WORKSPACE}/${agent}/memory/${file}`;
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent") || "";
  const file = searchParams.get("file") || "";

  if (!agent || !file) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const filePath = buildPath(agent, file);
  if (!filePath) return NextResponse.json({ error: "Agente inválido" }, { status: 400 });

  try {
    const res = await fetch(`${RELAY_URL}/readfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Secret": RELAY_SECRET },
      body: JSON.stringify({ path: filePath }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro ao conectar ao VPS" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const { agent, file, content } = await req.json();
  if (!agent || !file || content === undefined) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const filePath = buildPath(agent, file);
  if (!filePath) return NextResponse.json({ error: "Agente inválido" }, { status: 400 });

  try {
    const res = await fetch(`${RELAY_URL}/writefile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Secret": RELAY_SECRET },
      body: JSON.stringify({ path: filePath, content }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro ao conectar ao VPS" }, { status: 503 });
  }
}
