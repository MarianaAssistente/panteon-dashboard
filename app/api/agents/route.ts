import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fallback estático caso Supabase não retorne agents
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
    const [tasksRes, agentsRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/tasks?status=in.in_progress,review&select=agent_id,code,title,status,updated_at,priority&order=updated_at.desc`,
        { headers, cache: "no-store" }
      ),
      fetch(`${SUPABASE_URL}/rest/v1/agents?select=*&order=name.asc`, {
        headers,
        cache: "no-store",
      }),
    ]);

    const tasks = await tasksRes.json();
    const agentsRaw = await agentsRes.json();

    // Garantir que temos um array válido
    const agents = Array.isArray(agentsRaw) && agentsRaw.length > 0
      ? agentsRaw
      : STATIC_AGENTS;

    const tasksArr = Array.isArray(tasks) ? tasks : [];

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const enriched = agents.map((ag: any) => {
      const agentTasks = tasksArr.filter((t: any) => t.agent_id === ag.id);
      const latestTask = agentTasks[0];
      const lastUpdate = latestTask ? new Date(latestTask.updated_at).getTime() : 0;
      const isActive = lastUpdate > now - TWO_HOURS;

      return {
        ...ag,
        activeTasks: agentTasks,
        status: isActive ? "working" : agentTasks.length > 0 ? "idle" : "standby",
        lastActivityAt: latestTask?.updated_at || null,
      };
    });

    return NextResponse.json({ agents: enriched, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    // Fallback total: retornar agentes estáticos sem tasks
    const enriched = STATIC_AGENTS.map((ag) => ({
      ...ag,
      activeTasks: [],
      status: "standby",
      lastActivityAt: null,
    }));
    return NextResponse.json({ agents: enriched, fetchedAt: new Date().toISOString(), warning: err.message });
  }
}
