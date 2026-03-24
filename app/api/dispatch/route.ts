import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function sbUpsert(code: string, payload: object) {
  await fetch(`${SUPABASE_URL}/rest/v1/knowledge?on_conflict=code`, {
    method: "POST",
    headers: {
      apikey: SVC,
      Authorization: `Bearer ${SVC}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      code,
      title: `Dispatch ${code}`,
      content: JSON.stringify(payload),
      category: "sistema",
      tags: ["dispatch"],
      importance: "alto",
    }),
    cache: "no-store",
  });
}

export async function POST(req: Request) {
  const { agentId, task, taskCode } = await req.json();
  if (!agentId || !task)
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const requestId = `dispatch-${Date.now()}`;

  // Postar comando na fila — o dispatch-worker.py no VPS vai processar
  await sbUpsert("DISPATCH-CMD", {
    agent_id: agentId,
    task,
    task_code: taskCode || null,
    request_id: requestId,
    ts: Date.now() / 1000,
  });

  // Atualizar status da task no Supabase se taskCode fornecido
  if (taskCode) {
    const now = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/tasks?code=eq.${taskCode}`, {
      method: "PATCH",
      headers: {
        apikey: SVC,
        Authorization: `Bearer ${SVC}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in_progress", updated_at: now }),
      cache: "no-store",
    });
  }

  return NextResponse.json({
    ok: true,
    message: `Tarefa enviada para ${agentId}. O agente iniciará em instantes.`,
    requestId,
  });
}
