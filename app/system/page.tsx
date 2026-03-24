"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, Activity, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Server, Terminal, Calendar, PlayCircle, Zap, Users,
  Cpu, HardDrive, Wifi, ArrowUpCircle, ArrowDownCircle
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
// VPS MONITOR TYPES & COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

interface VpsMetrics {
  timestamp: number;
  cpu: { percent: number; count: number };
  memory: { total_gb: number; used_gb: number; percent: number };
  disk: { total_gb: number; used_gb: number; percent: number };
  network: { bytes_sent_mb: number; bytes_recv_mb: number };
  processes: Record<string, boolean>;
  uptime_seconds: number;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function GaugeBar({ percent, label, sublabel }: { percent: number; label: string; sublabel?: string }) {
  const color =
    percent >= 85 ? "bg-red-500" :
    percent >= 70 ? "bg-amber-400" :
    "bg-emerald-500";
  const textColor =
    percent >= 85 ? "text-red-400" :
    percent >= 70 ? "text-amber-400" :
    "text-emerald-400";

  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{percent.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {sublabel && <div className="text-xs text-zinc-500 mt-1">{sublabel}</div>}
    </div>
  );
}

function VpsMonitor() {
  const [metrics, setMetrics] = useState<VpsMetrics | null>(null);
  const [vpsError, setVpsError] = useState<string | null>(null);
  const [vpsLoading, setVpsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/system/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error("VPS offline");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMetrics(data);
      setVpsError(null);
    } catch (err: any) {
      setVpsError(err.message);
      setMetrics(null);
    } finally {
      setVpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (vpsLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Conectando ao VPS...
      </div>
    );
  }

  if (vpsError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center max-w-md">
          <Server className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-red-400 font-semibold mb-1">VPS Offline</div>
          <div className="text-red-300/70 text-sm">{vpsError || "Não foi possível obter métricas"}</div>
        </div>
      </div>
    );
  }

  const alerts = [];
  if (metrics.cpu.percent > 80) alerts.push({ msg: `CPU em ${metrics.cpu.percent.toFixed(1)}%`, level: "red" });
  if (metrics.memory.percent > 90) alerts.push({ msg: `RAM em ${metrics.memory.percent.toFixed(1)}%`, level: "red" });
  if (metrics.disk.percent > 85) alerts.push({ msg: `Disco em ${metrics.disk.percent.toFixed(1)}%`, level: "yellow" });

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${
              a.level === "red"
                ? "bg-red-500/10 border-red-500/40 text-red-400"
                : "bg-amber-500/10 border-amber-500/40 text-amber-400"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              ⚠️ {a.msg} — atenção necessária
            </div>
          ))}
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-zinc-400 text-sm">CPU</span>
          </div>
          <div className={`text-3xl font-bold ${metrics.cpu.percent > 80 ? "text-red-400" : metrics.cpu.percent > 70 ? "text-amber-400" : "text-emerald-400"}`}>
            {metrics.cpu.percent.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500">{metrics.cpu.count} vCPUs</div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${metrics.cpu.percent > 80 ? "bg-red-500" : metrics.cpu.percent > 70 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${metrics.cpu.percent}%` }} />
          </div>
        </div>

        {/* RAM */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-zinc-400 text-sm">RAM</span>
          </div>
          <div className={`text-3xl font-bold ${metrics.memory.percent > 90 ? "text-red-400" : metrics.memory.percent > 70 ? "text-amber-400" : "text-emerald-400"}`}>
            {metrics.memory.percent.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500">{metrics.memory.used_gb}GB / {metrics.memory.total_gb}GB</div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${metrics.memory.percent > 90 ? "bg-red-500" : metrics.memory.percent > 70 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${metrics.memory.percent}%` }} />
          </div>
        </div>

        {/* Disco */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-zinc-400 text-sm">Disco</span>
          </div>
          <div className={`text-3xl font-bold ${metrics.disk.percent > 85 ? "text-red-400" : metrics.disk.percent > 70 ? "text-amber-400" : "text-emerald-400"}`}>
            {metrics.disk.percent.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500">{metrics.disk.used_gb}GB / {metrics.disk.total_gb}GB</div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${metrics.disk.percent > 85 ? "bg-red-500" : metrics.disk.percent > 70 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${metrics.disk.percent}%` }} />
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-zinc-400 text-sm">Uptime</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]">
            {formatUptime(metrics.uptime_seconds)}
          </div>
          <div className="text-xs text-zinc-500">desde o último boot</div>
        </div>
      </div>

      {/* Processos + Rede */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Processos críticos */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#D4AF37]" /> Processos Críticos
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics.processes).map(([name, running]) => (
              <div key={name} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                running ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
              }`}>
                {running
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className={`text-sm font-medium capitalize ${running ? "text-emerald-300" : "text-red-300"}`}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rede */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#D4AF37]" /> Tráfego de Rede
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-zinc-400">Enviado</span>
              </div>
              <span className="text-sm font-mono text-blue-300">{metrics.network.bytes_sent_mb.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-zinc-400">Recebido</span>
              </div>
              <span className="text-sm font-mono text-violet-300">{metrics.network.bytes_recv_mb.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} MB</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-600">
            Atualizado: {new Date(metrics.timestamp * 1000).toLocaleTimeString("pt-BR")}
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<"vps" | "crons" | "heartbeats">("vps");
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
            { key: "vps", label: "Monitor VPS", icon: Server },
            { key: "crons", label: "Crons Agendados", icon: Terminal },
            { key: "heartbeats", label: "Heartbeats dos Agentes", icon: Activity },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? `${key === "vps" ? "border-[#D4AF37] text-[#D4AF37]" : "border-violet-500 text-violet-400"}`
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* VPS MONITOR */}
        {activeTab === "vps" && <VpsMonitor />}

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
