import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const headers = { apikey: SVC, Authorization: `Bearer ${SVC}` };
  const code = params.code;

  const [projectRes, tasksRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/projects?code=eq.${code}&select=*`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/tasks?project_code=eq.${code}&select=code,title,status,agent_id,priority,updated_at,completed_at,deliverable_url&order=updated_at.desc`, { headers, cache: "no-store" }),
  ]);

  const projects = await projectRes.json();
  const tasks = await tasksRes.json();

  if (!Array.isArray(projects) || projects.length === 0)
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const project = projects[0];
  const tasksArr = Array.isArray(tasks) ? tasks : [];

  const total = tasksArr.length;
  const done = tasksArr.filter((t: any) => t.status === "done").length;
  const inProgress = tasksArr.filter((t: any) => t.status === "in_progress").length;
  const review = tasksArr.filter((t: any) => t.status === "review").length;
  const blocked = tasksArr.filter((t: any) => t.status === "blocked").length;
  const backlog = tasksArr.filter((t: any) => t.status === "backlog").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return NextResponse.json({
    ...project,
    tasks: tasksArr,
    metrics: { total, done, inProgress, review, blocked, backlog, progress },
  });
}
