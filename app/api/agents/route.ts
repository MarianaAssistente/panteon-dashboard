import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STATIC_AGENTS = [
  { id: "mariana",  name: "Mariana",  role: "CEO" },
  { id: "atena",    name: "Atena",    role: "CSO" },
  { id: "hefesto",  name: "Hefesto",  role: "CTO" },
  { id: "ares",     name: "Ares",     role: "CQO" },
  { id: "hera",     name: "Hera",     role: "COO" },
  { id: "afrodite", name: "Afrodite", role: "CMO" },
  { id: "apollo",   name: "Apollo",   role: "CCO" },
  { id: "hestia",   name: "Héstia",   role: "CPA" },
];

export async function GET() {
  const headers = { apikey: SVC, Authorization: `Bearer ${SVC}` };

  try {
    const [activeRes, recentRes, agentsRes] = await Promise.all([
      // Tasks ativas (in_progress ou review)
      fetch(`${SUPABASE_URL}/rest/v1/tasks?status=in.in_progress,review&select=agent_id,code,title,status,updated_at,priority&order=updated_at.desc`, { headers, cache: "no-store" }),
      // Tasks concluídas recentemente (últimas 48h) para "última atividade"
      fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.done&select=agent_id,code,title,status,completed_at,updated_at&order=updated_at.desc&limit=50`, { headers, cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/agents?select=*&order=name.asc`, { headers, cache: "no-store" }),
    ]);

    const activeTasks = await activeRes.json();
    const recentTasks = await recentRes.json();
    const agentsRaw = await agentsRes.json();

    const agents = Array.isArray(agentsRaw) && agentsRaw.length > 0 ? agentsRaw : STATIC_AGENTS;
    const activeArr = Array.isArray(activeTasks) ? activeTasks : [];
    const recentArr = Array.isArray(recentTasks) ? recentTasks : [];
    const allTasks = [...activeArr, ...recentArr];

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const enriched = agents.map((ag: any) => {
      const agentActive = activeArr.filter((t: any) => t.agent_id === ag.id);
      // Última atividade = task mais recente (ativa ou concluída)
      const agentAll = allTasks.filter((t: any) => t.agent_id === ag.id);
      const latestAny = agentAll.sort((a: any, b: any) =>
        new Date(b.updated_at || b.completed_at).getTime() - new Date(a.updated_at || a.completed_at).getTime()
      )[0];
      const latestActive = agentActive[0];
      const lastUpdate = latestActive ? new Date(latestActive.updated_at).getTime() : 0;
      const isActive = lastUpdate > now - TWO_HOURS;

      return {
        ...ag,
        activeTasks: agentActive,
        status: isActive ? "working" : agentActive.length > 0 ? "idle" : "standby",
        lastActivityAt: latestAny?.updated_at || latestAny?.completed_at || null,
        lastTaskTitle: latestAny?.title || null,
      };
    });

    return NextResponse.json({ agents: enriched, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    const enriched = STATIC_AGENTS.map((ag) => ({ ...ag, activeTasks: [], status: "standby", lastActivityAt: null, lastTaskTitle: null }));
    return NextResponse.json({ agents: enriched, fetchedAt: new Date().toISOString(), warning: err.message });
  }
}
