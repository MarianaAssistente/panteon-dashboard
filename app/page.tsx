import { supabase, Agent, Task, AGENTS_STATIC } from "@/lib/supabase";
import AgentCard from "@/components/AgentCard";
import CostWidget from "@/components/CostWidget";
import TaskDrawer from "@/components/TaskDrawer";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";

async function getData() {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [agentsRes, recentTasksRes, pendingRes, todayTasksRes, dayCostRes, monthCostRes, lastTasksRes] =
    await Promise.all([
      supabase.from("agents").select("*").order("name"),
      supabase
        .from("tasks")
        .select("*, agents(id, name, role, model)")
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase.from("tasks").select("id, agent_id").eq("approval_status", "pending"),
      supabase
        .from("tasks")
        .select("id, status")
        .gte("created_at", today + "T00:00:00Z"),
      supabase
        .from("daily_metrics")
        .select("estimated_cost_usd")
        .eq("date", today),
      supabase
        .from("daily_metrics")
        .select("estimated_cost_usd")
        .gte("date", monthStart.split("T")[0]),
      supabase
        .from("tasks")
        .select("agent_id, title, updated_at")
        .in("status", ["in_progress", "review", "done"])
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

  // Count pending per agent
  const pendingByAgent: Record<string, number> = {};
  for (const t of pendingRes.data ?? []) {
    if (t.agent_id) pendingByAgent[t.agent_id] = (pendingByAgent[t.agent_id] ?? 0) + 1;
  }

  // Last task per agent
  const lastTaskByAgent: Record<string, string> = {};
  for (const t of lastTasksRes.data ?? []) {
    if (t.agent_id && !lastTaskByAgent[t.agent_id]) {
      lastTaskByAgent[t.agent_id] = t.title;
    }
  }

  // Task counters
  const todayTasks = todayTasksRes.data ?? [];
  const todayPending = todayTasks.filter(t => ["backlog", "in_progress", "review"].includes(t.status)).length;
  const todayInProgress = todayTasks.filter(t => t.status === "in_progress").length;
  const todayDone = todayTasks.filter(t => t.status === "done").length;

  // Costs
  const dayCost = (dayCostRes.data ?? []).reduce((s, m) => s + Number(m.estimated_cost_usd), 0);
  const monthCost = (monthCostRes.data ?? []).reduce((s, m) => s + Number(m.estimated_cost_usd), 0);

  const agents: Agent[] = agentsRes.data?.length ? agentsRes.data : AGENTS_STATIC;

  return {
    agents,
    recentTasks: (recentTasksRes.data ?? []) as Task[],
    pendingApprovals: pendingRes.data?.length ?? 0,
    pendingByAgent,
    lastTaskByAgent,
    todayPending,
    todayInProgress,
    todayDone,
    dayCost,
    monthCost,
  };
}

export const revalidate = 60;

export default async function DashboardPage() {
  const {
    agents,
    recentTasks,
    pendingApprovals,
    pendingByAgent,
    lastTaskByAgent,
    todayPending,
    todayInProgress,
    todayDone,
    dayCost,
    monthCost,
  } = await getData();

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37] tracking-tight">
            Panteão do Olimpo
          </h1>
          <p className="text-[#F5F5F5]/40 text-sm mt-1 capitalize">{today}</p>
        </div>
        {pendingApprovals > 0 && (
          <a
            href="/approvals"
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingApprovals}
            </span>
            {pendingApprovals === 1 ? "item aguardando aprovação" : "itens aguardando aprovação"}
          </a>
        )}
      </div>

      {/* Task counters + Cost */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4">
          <p className="text-2xl font-bold text-[#F5F5F5]/50">{todayPending}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Pendentes hoje</p>
        </div>
        <div className="bg-[#141414] border border-blue-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{todayInProgress}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Em andamento</p>
        </div>
        <div className="bg-[#141414] border border-green-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{todayDone}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Concluídas hoje</p>
        </div>
        <CostWidget dayCost={dayCost} monthCost={monthCost} />
      </div>

      {/* Agent Grid */}
      <div className="mb-8">
        <p className="text-[#F5F5F5]/30 text-xs font-semibold uppercase tracking-widest mb-4">
          Agentes do Panteão
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              lastTask={lastTaskByAgent[agent.id]}
              pendingCount={pendingByAgent[agent.id] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <p className="text-[#F5F5F5]/30 text-xs font-semibold uppercase tracking-widest mb-4">
          Atividade recente
        </p>
        <div className="space-y-2">
          {recentTasks.map((task) => (
            <TaskDrawer
              key={task.id}
              task={task}
              trigger={
                <div className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl px-4 py-3 hover:border-[#D4AF37]/25 hover:bg-[#181818] transition-all cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {task.agents && (
                        <span className="text-[#D4AF37]/50 text-xs shrink-0">
                          @{task.agents.name}
                        </span>
                      )}
                      <p className="text-[#F5F5F5]/80 text-sm truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={task.status} type="task" />
                      <span className="text-[#F5F5F5]/20 text-xs hidden sm:block">
                        {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              }
            />
          ))}
          {recentTasks.length === 0 && (
            <div className="text-center py-10 text-[#F5F5F5]/20 text-sm bg-[#141414] rounded-xl border border-[#D4AF37]/10">
              Nenhuma tarefa ainda. Configure o Supabase e adicione dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
