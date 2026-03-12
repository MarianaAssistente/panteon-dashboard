"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, Agent, Task, AGENTS_STATIC } from "@/lib/supabase";
import AgentCard from "@/components/AgentCard";
import CostWidget from "@/components/CostWidget";
import TaskDrawer from "@/components/TaskDrawer";
import StatusBadge from "@/components/StatusBadge";
import { format, formatDistanceToNow, isToday, subMinutes, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, CheckCircle2, Clock, Hourglass, Activity } from "lucide-react";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

interface DashboardData {
  agents: Agent[];
  recentTasks: Task[];
  todayDone: Task[];
  inProgressTasks: Task[];
  backlogTasks: Task[];
  pendingApprovals: number;
  pendingByAgent: Record<string, number>;
  lastTaskByAgent: Record<string, string>;
  lastActivityByAgent: Record<string, string>; // ISO timestamp
  dayCost: number;
  monthCost: number;
  loadedAt: Date;
}

async function fetchData(): Promise<DashboardData> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1).toISOString().split("T")[0];

  const [agentsRes, recentRes, doneRes, inProgressRes, backlogRes, pendingRes, dayCostRes, monthCostRes, activityRes] =
    await Promise.all([
      supabase.from("agents").select("*").order("name"),
      // Atividade recente (últimas 20 tasks atualizadas)
      supabase.from("tasks").select("*, agents(id, name, role, model)")
        .order("updated_at", { ascending: false }).limit(20),
      // Concluídas hoje (updated_at hoje + status done)
      supabase.from("tasks").select("*, agents(id, name, role, model)")
        .eq("status", "done")
        .gte("updated_at", todayISO)
        .order("updated_at", { ascending: false }),
      // Em andamento agora
      supabase.from("tasks").select("*, agents(id, name, role, model)")
        .in("status", ["in_progress", "review"])
        .order("updated_at", { ascending: false }),
      // Backlog / pendentes
      supabase.from("tasks").select("*, agents(id, name, role, model)")
        .in("status", ["backlog", "blocked"])
        .order("priority").order("updated_at", { ascending: false }).limit(10),
      // Aprovações pendentes
      supabase.from("tasks").select("id, agent_id").eq("approval_status", "pending"),
      // Custo hoje
      supabase.from("daily_metrics").select("estimated_cost_usd").eq("date", todayStart.toISOString().split("T")[0]),
      // Custo mês
      supabase.from("daily_metrics").select("estimated_cost_usd").gte("date", monthStart),
      // Última atividade por agente
      supabase.from("tasks").select("agent_id, updated_at")
        .order("updated_at", { ascending: false }).limit(100),
    ]);

  const pendingByAgent: Record<string, number> = {};
  for (const t of pendingRes.data ?? []) {
    if (t.agent_id) pendingByAgent[t.agent_id] = (pendingByAgent[t.agent_id] ?? 0) + 1;
  }

  const lastTaskByAgent: Record<string, string> = {};
  const lastActivityByAgent: Record<string, string> = {};
  for (const t of activityRes.data ?? []) {
    if (t.agent_id) {
      if (!lastActivityByAgent[t.agent_id]) {
        lastActivityByAgent[t.agent_id] = t.updated_at;
      }
    }
  }
  for (const t of recentRes.data ?? []) {
    if (t.agent_id && !lastTaskByAgent[t.agent_id]) {
      lastTaskByAgent[t.agent_id] = t.title;
    }
  }

  return {
    agents: agentsRes.data?.length ? agentsRes.data as Agent[] : AGENTS_STATIC,
    recentTasks: (recentRes.data ?? []) as Task[],
    todayDone: (doneRes.data ?? []) as Task[],
    inProgressTasks: (inProgressRes.data ?? []) as Task[],
    backlogTasks: (backlogRes.data ?? []) as Task[],
    pendingApprovals: pendingRes.data?.length ?? 0,
    pendingByAgent,
    lastTaskByAgent,
    lastActivityByAgent,
    dayCost: (dayCostRes.data ?? []).reduce((s, m) => s + Number(m.estimated_cost_usd), 0),
    monthCost: (monthCostRes.data ?? []).reduce((s, m) => s + Number(m.estimated_cost_usd), 0),
    loadedAt: new Date(),
  };
}

function agentSessionStatus(agentId: string, lastActivity: string | undefined): "active" | "recent" | "idle" {
  if (!lastActivity) return "idle";
  const t = new Date(lastActivity);
  if (t > subMinutes(new Date(), 30)) return "active";
  if (t > subHours(new Date(), 4)) return "recent";
  return "idle";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const d = await fetchData();
      setData(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Countdown visual
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-[#D4AF37]/50">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  const countdownMin = Math.floor(countdown / 60);
  const countdownSec = countdown % 60;

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37] tracking-tight">Panteão do Olimpo</h1>
          <p className="text-[#F5F5F5]/40 text-sm mt-1 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh badge */}
          <button onClick={() => load(true)}
            className="flex items-center gap-1.5 bg-[#111] border border-[#D4AF37]/10 px-3 py-1.5 rounded-lg text-[10px] text-[#F5F5F5]/30 hover:text-[#D4AF37]/60 transition-colors">
            <RefreshCw size={10} className={refreshing ? "animate-spin text-[#D4AF37]" : ""} />
            {refreshing ? "Atualizando..." : `Próx. ${countdownMin}:${String(countdownSec).padStart(2,"0")}`}
          </button>
          {data.pendingApprovals > 0 && (
            <a href="/approvals"
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors">
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{data.pendingApprovals}</span>
              {data.pendingApprovals === 1 ? "aguardando aprovação" : "aguardando aprovação"}
            </a>
          )}
        </div>
      </div>

      {/* Contadores do dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<CheckCircle2 size={16} />}
          value={data.todayDone.length}
          label="Concluídas hoje"
          color="#4ADE80"
          borderColor="border-green-500/20"
        />
        <StatCard
          icon={<Activity size={16} />}
          value={data.inProgressTasks.length}
          label="Em andamento"
          color="#60A5FA"
          borderColor="border-blue-500/20"
        />
        <StatCard
          icon={<Hourglass size={16} />}
          value={data.backlogTasks.length}
          label="Pendentes"
          color="#F5F5F5"
          borderColor="border-white/10"
          dim
        />
        <CostWidget dayCost={data.dayCost} monthCost={data.monthCost} />
      </div>

      {/* Concluídas hoje */}
      {data.todayDone.length > 0 && (
        <Section title="Concluídas hoje" color="#4ADE80" count={data.todayDone.length}>
          <div className="space-y-2">
            {data.todayDone.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </Section>
      )}

      {/* Em andamento */}
      {data.inProgressTasks.length > 0 && (
        <Section title="Em andamento agora" color="#60A5FA" count={data.inProgressTasks.length}>
          <div className="space-y-2">
            {data.inProgressTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </Section>
      )}

      {/* Pendentes / Backlog */}
      {data.backlogTasks.length > 0 && (
        <Section title="Pendentes / Backlog" color="#71717A" count={data.backlogTasks.length}>
          <div className="space-y-2">
            {data.backlogTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </Section>
      )}

      {/* Agentes */}
      <div className="mb-8">
        <p className="text-[#F5F5F5]/30 text-xs font-semibold uppercase tracking-widest mb-4">
          Agentes do Panteão
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.agents.map((agent) => {
            const sessionStatus = agentSessionStatus(agent.id, data.lastActivityByAgent[agent.id]);
            return (
              <div key={agent.id} className="relative">
                <AgentCard
                  agent={agent}
                  lastTask={data.lastTaskByAgent[agent.id]}
                  pendingCount={data.pendingByAgent[agent.id] ?? 0}
                />
                {/* Session indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    sessionStatus === "active" ? "bg-green-400 animate-pulse" :
                    sessionStatus === "recent" ? "bg-yellow-400" :
                    "bg-zinc-600"
                  }`} />
                  <span className="text-[9px] text-[#F5F5F5]/25">
                    {sessionStatus === "active" ? "ativo" :
                     sessionStatus === "recent" ? "recente" : "idle"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Última atualização */}
      <p className="text-center text-[10px] text-[#F5F5F5]/15 mt-6">
        Atualizado às {format(data.loadedAt, "HH:mm:ss")} · auto-refresh a cada 15 min
      </p>
    </div>
  );
}

function StatCard({ icon, value, label, color, borderColor, dim }: {
  icon: React.ReactNode; value: number; label: string; color: string;
  borderColor: string; dim?: boolean;
}) {
  return (
    <div className={`bg-[#141414] border ${borderColor} rounded-xl p-4 flex items-center gap-3`}>
      <span style={{ color: dim ? "rgba(245,245,245,0.3)" : color }}>{icon}</span>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: dim ? "rgba(245,245,245,0.5)" : color }}>{value}</p>
        <p className="text-[#F5F5F5]/30 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

function Section({ title, color, count, children }: {
  title: string; color: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: `${color}99` }}>{title}</p>
        <span className="text-[10px] text-[#F5F5F5]/20 bg-[#111] px-2 py-0.5 rounded-full border border-[#D4AF37]/8">{count}</span>
      </div>
      {children}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <TaskDrawer
      task={task}
      trigger={
        <div className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl px-4 py-3 hover:border-[#D4AF37]/25 hover:bg-[#181818] transition-all cursor-pointer">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {task.agents && (
                <span className="text-[#D4AF37]/50 text-xs shrink-0">@{task.agents.name}</span>
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
  );
}
