"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, Activity, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Server, Terminal, Calendar, PlayCircle, Zap, Users
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  tz: string;
  status: "ok" | "error" | "disabled" | "pending";
  consecutiveErrors: number;
  lastRunStatus?: string | null;
  lastDurationMs?: number | null;
}

interface Heartbeat {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  model: string;
  status: "working" | "idle" | "standby" | "blocked";
  heartbeatStatus: "healthy" | "warning" | "critical" | "unknown";
  activeTasks: number;
  blockedTasks: number;
  totalPending: number;
  updatedAt: string;
}

interface Summary {
  totalCrons: number;
  cronsOk: number;
  cronsError: number;
  agentsWorking: number;
  agentsIdle: number;
  agentsStandby: number;
  tasksActive: number;
  tasksBlocked: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms?: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function cronLabel(expr: string) {
  const map: Record<string, string> = {
    "*/15 * * * *": "A cada 15 min",
    "0 10 * * 0": "Dom 10h BRT",
    "0 13 * * 0": "Dom 13h UTC (10h BRT)",
    "0 23 * * 0": "Dom 23h BRT",
    "0 12 * * 1": "Seg 12h BRT",
  };
  return map[expr] || expr;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function CronStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    disabled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const icons: Record<string, any> = {
    ok: CheckCircle, error: XCircle, disabled: AlertCircle, pending: Clock,
  };
  const Icon = icons[status] || AlertCircle;
  const label: Record<string, string> = { ok: "OK", error: "ERRO", disabled: "DESATIVADO", pending: "AGUARDANDO" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.disabled}`}>
      <Icon className="w-3.5 h-3.5" />
      {label[status] || status.toUpperCase()}
    </span>
  );
}

function AgentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    working: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    standby: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    blocked: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const label: Record<string, string> = {
    working: "ATIVO", idle: "IDLE", standby: "STANDBY", blocked: "BLOQUEADO",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.standby}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "working" ? "bg-emerald-400 animate-pulse" : "bg-current"}`} />
      {label[status] || status.toUpperCase()}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<"crons" | "heartbeats">("crons");
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCrons(data.crons || []);
      setHeartbeats(data.heartbeats || []);
      setSummary(data.summary || null);
      setFetchedAt(data.fetchedAt || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // auto-refresh 60s
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
              <Server className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Infraestrutura do Panteão</h1>
              <p className="text-zinc-500 text-sm">
                Crons, heartbeats e status ao vivo
                {fetchedAt && (
                  <span className="ml-2 text-zinc-600">· atualizado {formatDate(fetchedAt)}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <span className="text-zinc-400 text-sm">Crons</span>
            </div>
            <div className="text-3xl font-bold">{summary?.totalCrons ?? crons.length}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {summary?.cronsOk ?? 0} ok · <span className={summary?.cronsError ? "text-red-400" : ""}>{summary?.cronsError ?? 0} erro</span>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400 text-sm">Agentes Ativos</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{summary?.agentsWorking ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {summary?.agentsIdle ?? 0} idle · {summary?.agentsStandby ?? 0} standby
            </div>
          </div>
          <div className={`bg-zinc-900/50 border rounded-xl p-4 ${(summary?.tasksBlocked ?? 0) > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-4 h-4 ${(summary?.tasksBlocked ?? 0) > 0 ? "text-red-400" : "text-zinc-400"}`} />
              <span className="text-zinc-400 text-sm">Bloqueados</span>
            </div>
            <div className={`text-3xl font-bold ${(summary?.tasksBlocked ?? 0) > 0 ? "text-red-400" : ""}`}>
              {summary?.tasksBlocked ?? 0}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{summary?.tasksActive ?? 0} em andamento</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-zinc-400 text-sm">Agentes</span>
            </div>
            <div className="text-3xl font-bold">{heartbeats.length}</div>
            <div className="text-xs text-zinc-500 mt-1">no Panteão</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-zinc-800 mb-6">
          {[
            { key: "crons", label: "Crons Agendados", icon: Terminal },
            { key: "heartbeats", label: "Heartbeats dos Agentes", icon: Activity },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* CRONS */}
        {activeTab === "crons" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {isLoading && crons.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50 border-b border-zinc-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Nome</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Agendamento</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Duração</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {crons.map((cron) => (
                      <tr key={cron.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-sm">{cron.name}</div>
                          {cron.description && (
                            <div className="text-xs text-zinc-500 mt-0.5">{cron.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <code className="px-2 py-1 bg-zinc-800 rounded text-xs text-violet-300 font-mono">
                            {cron.schedule}
                          </code>
                          <div className="text-xs text-zinc-500 mt-1">{cronLabel(cron.schedule)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-zinc-300 text-sm">{formatDuration(cron.lastDurationMs)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <CronStatusBadge status={cron.status} />
                          {cron.consecutiveErrors > 0 && (
                            <div className="text-xs text-red-400 mt-1">
                              {cron.consecutiveErrors} erro(s)
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HEARTBEATS */}
        {activeTab === "heartbeats" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {isLoading && heartbeats.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50 border-b border-zinc-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Agente</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Modelo</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Tarefas</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {heartbeats.map((hb) => (
                      <tr key={hb.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-sm">{hb.name}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{hb.role}</div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-xs text-zinc-400 font-mono">{hb.model}</code>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <span className="text-emerald-400">{hb.activeTasks}</span>
                            <span className="text-zinc-500"> ativas · </span>
                            <span className={hb.blockedTasks > 0 ? "text-red-400" : "text-zinc-500"}>
                              {hb.blockedTasks}
                            </span>
                            <span className="text-zinc-500"> bloq.</span>
                          </div>
                          <div className="text-xs text-zinc-600 mt-0.5">{hb.totalPending} pendentes total</div>
                        </td>
                        <td className="px-4 py-4">
                          <AgentStatusBadge status={hb.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Legenda */}
        <div className="mt-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-zinc-400">
            <Terminal className="w-4 h-4" />
            Legenda — Status dos Agentes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ATIVO — sessão em andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>IDLE — tarefa sem sessão ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>BLOQUEADO — aguardando aprovação</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span>STANDBY — sem tarefas ativas</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
