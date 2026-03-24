import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { agentId, task } = await req.json();
  if (!agentId || !task)
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  // TODO: integrar com sessions_send via OpenClaw gateway
  return NextResponse.json({ ok: true, message: `Tarefa enviada para ${agentId}` });
}
