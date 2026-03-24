import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const headers = { apikey: ANON, Authorization: `Bearer ${ANON}` };

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
  const agents = await agentsRes.json();

  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  const enriched = agents.map((ag: any) => {
    const agentTasks = tasks.filter((t: any) => t.agent_id === ag.id);
    const latestTask = agentTasks[0];
    const lastUpdate = latestTask
      ? new Date(latestTask.updated_at).getTime()
      : 0;
    const isActive = lastUpdate > now - TWO_HOURS;

    return {
      ...ag,
      activeTasks: agentTasks,
      status: isActive ? "working" : agentTasks.length > 0 ? "idle" : "standby",
      lastActivityAt: latestTask?.updated_at || null,
    };
  });

  return NextResponse.json({
    agents: enriched,
    fetchedAt: new Date().toISOString(),
  });
}
