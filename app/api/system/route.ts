import { NextResponse } from "next/server";

const SUPABASE_URL = "https://duogqvusxueetapcvsfp.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzMTMxOCwiZXhwIjoyMDg4NDA3MzE4fQ.0L45hSJTcit5DsgKRBB021EX0GTMOh8Yq3rIfomxT58";

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// Crons reais do OpenClaw (atualizados manualmente — atualizar quando mudar)
const CRONS_STATIC = [
  {
    id: "a1b2c3d4-status-monitor-15min",
    name: "agent-status-monitor",
    description: "Verifica status de cada agente a cada 15min e atualiza Supabase",
    schedule: "*/15 * * * *",
    tz: "America/Recife",
    status: "ok",
    consecutiveErrors: 0,
    lastRunStatus: "ok",
    lastDurationMs: 47303,
  },
  {
    id: "16f85c7a-65f7-400f-ab7f-9aba90945513",
    name: "relatorio-semanal-domingo",
    description: "Relatório semanal STM Group para Yuri (DOM 10h BRT)",
    schedule: "0 13 * * 0",
    tz: "America/Recife",
    status: "error",
    consecutiveErrors: 1,
    lastRunStatus: "error",
    lastDurationMs: 130623,
  },
  {
    id: "208cc466-6184-416a-958c-89fe10f6c091",
    name: "sync-notion-trello",
    description: "Checklist semanal de sincronização Notion + Trello",
    schedule: "0 13 * * 0",
    tz: "America/Recife",
    status: "ok",
    consecutiveErrors: 0,
    lastRunStatus: "ok",
    lastDurationMs: 312443,
  },
  {
    id: "e581b153-a758-442e-9bfb-c24c61bc57a5",
    name: "destilacao-semanal",
    description: "Ritual de destilação semanal de memória dos agentes",
    schedule: "0 23 * * 0",
    tz: "America/Recife",
    status: "ok",
    consecutiveErrors: 0,
    lastRunStatus: "ok",
    lastDurationMs: 105256,
  },
  {
    id: "ecbd881c-dc31-42ca-a5b4-e2ea4c96321e",
    name: "prioridades-semana",
    description: "Pergunta prioridades da semana para Yuri (SEG 12h BRT)",
    schedule: "0 12 * * 1",
    tz: "America/Recife",
    status: "ok",
    consecutiveErrors: 0,
    lastRunStatus: "ok",
    lastDurationMs: 25577,
  },
  {
    id: "agenda-conteudo-domingo",
    name: "agenda-conteudo-domingo",
    description: "Gera roteiro semanal HTML + agenda conteúdo no dashboard (DOM 10h BRT)",
    schedule: "0 10 * * 0",
    tz: "America/Recife",
    status: "pending",
    consecutiveErrors: 0,
    lastRunStatus: null,
    lastDurationMs: null,
  },
];

export async function GET() {
  try {
    // Buscar agentes (heartbeats)
    const agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=*`, {
      headers: HEADERS,
      next: { revalidate: 30 },
    });
    const agents = await agentsRes.json();

    // Buscar tarefas ativas por agente
    const tasksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?status=neq.done&select=agent_id,code,title,status&order=updated_at.desc`,
      { headers: HEADERS, next: { revalidate: 30 } }
    );
    const tasks = await tasksRes.json();

    // Montar heartbeats com dados reais
    const heartbeats = agents.map((agent: any) => {
      const agentTasks = tasks.filter((t: any) => t.agent_id === agent.id);
      const activeTasks = agentTasks.filter((t: any) => t.status === "in_progress").length;
      const blockedTasks = agentTasks.filter((t: any) => t.status === "blocked").length;

      let heartbeatStatus = "unknown";
      if (agent.status === "working") heartbeatStatus = "healthy";
      else if (agent.status === "idle" && activeTasks > 0) heartbeatStatus = "warning";
      else if (blockedTasks > 0) heartbeatStatus = "critical";
      else if (agent.status === "standby") heartbeatStatus = "unknown";
      else heartbeatStatus = "warning";

      return {
        id: `hb-${agent.id}`,
        agent_id: agent.id,
        name: `${agent.name} ${agent.role}`,
        role: agent.role,
        model: agent.model,
        status: agent.status,
        heartbeatStatus,
        activeTasks,
        blockedTasks,
        totalPending: agentTasks.length,
        updatedAt: agent.updated_at || agent.created_at,
      };
    });

    return NextResponse.json({
      crons: CRONS_STATIC,
      heartbeats,
      tasks: tasks.slice(0, 20),
      summary: {
        totalCrons: CRONS_STATIC.length,
        cronsOk: CRONS_STATIC.filter((c) => c.status === "ok").length,
        cronsError: CRONS_STATIC.filter((c) => c.status === "error").length,
        agentsWorking: agents.filter((a: any) => a.status === "working").length,
        agentsIdle: agents.filter((a: any) => a.status === "idle").length,
        agentsStandby: agents.filter((a: any) => a.status === "standby").length,
        tasksActive: tasks.filter((t: any) => t.status === "in_progress").length,
        tasksBlocked: tasks.filter((t: any) => t.status === "blocked").length,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
