"use client";

import { useState, useEffect } from "react";
import {
  Clock, Activity, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Server, Terminal, Calendar, PlayCircle
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  status: "ok" | "error" | "disabled";
  lastStatus?: string;
  consecutiveErrors: number;
  tz: string;
}

interface Heartbeat {
  id: string;
  name: string;
  agent: string;
  frequency: string;
  lastCheck?: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  nextExpected: string;
}

// ═══════════════════════════════════════════════════════════════════════
// MOCK DATA — Será substituído por API real
// ═══════════════════════════════════════════════════════════════════════

const CRONS: CronJob[] = [
  {
    id: "a1b2c3d4-status-monitor-15min",
    name: "agent-status-monitor",
    description: "Verifica status de cada agente a cada 15min",
    schedule: "*/15 * * * *",
    nextRun: "2026-03-17T14:00:00Z",
    lastRun: "2026-03-17T13:45:00Z",
    status: "ok",
    lastStatus: "ok",
    consecutiveErrors: 0,
    tz: "America/Recife",
  },
  {
    id: "16f85c7a-relatorio-semanal",
    name: "relatorio-semanal-domingo",
    description: "Relatório semanal STM Group para Yuri",
    schedule: "0 13 * * 0",
    nextRun: "2026-03-22T16:00:00Z",
    lastRun: "2026-03-15T16:00:00Z",
    status: "error",
    lastStatus: "error",
    consecutiveErrors: 1,
    tz: "America/Recife",
  },
  {
    id: "208cc466-sync-notion-trello",
    name: "sync-notion-trello",
    description: "Checklist semanal Notion + Trello",
    schedule: "0 13 * * 0",
    nextRun: "2026-03-22T16:00:00Z",
    lastRun: "2026-03-15T16:00:00Z",
    status: "ok",
    lastStatus: "ok",
    consecutiveErrors: 0,
    tz: "America/Recife",
  },
  {
    id: "e581b153-destilacao-semanal",
    name: "destilacao-semanal",
    description: "Ritual de destilação semanal de memória",
    schedule: "0 23 * * 0",
    nextRun: "2026-03-22T02:00:00Z",
    lastRun: "2026-03-16T02:00:00Z",
    status: "ok",
    lastStatus: "ok",
    consecutiveErrors: 0,
    tz: "America/Recife",
  },
  {
    id: "ecbd881c-prioridades-semana",
    name: "prioridades-semana",
    description: "Pergunta prioridades da semana às segundas",
    schedule: "0 12 * * 1",
    nextRun: "2026-03-23T15:00:00Z",
    lastRun: "2026-03-16T15:00:00Z",
    status: "ok",
    lastStatus: "ok",
    consecutiveErrors: 0,
    tz: "America/Recife",
  },
  {
    id: "962a6b78-agenda-conteudo-domingo",
    name: "agenda-conteudo-domingo",
    description: "Gera roteiro HTML + agenda no dashboard (DOM 10h)",
    schedule: "0 10 * * 0",
    nextRun: "2026-03-22T13:00:00Z",
    lastRun: undefined,
    status: "ok",
    lastStatus: undefined,
    consecutiveErrors: 0,
    tz: "America/Recife",
  },
];

const HEARTBEATS: Heartbeat[] = [
  {
    id: "hb-mariana",
    name: "Mariana CEO",
    agent: "mariana",
    frequency: "3x/dia (09h, 16h, 21h)",
    lastCheck: "2026-03-17T13:30:00Z",
    status: "healthy",
    nextExpected: "2026-03-17T16:00:00Z",
  },
  {
    id: "hb-atena",
    name: "Atena CSO",
    agent: "atena",
    frequency: "Sob demanda",
    lastCheck: "2026-03-17T10:00:00Z",
    status: "warning",
    nextExpected: "2026-03-17T18:00:00Z",
  },
  {
    id: "hb-hefesto",
    name: "Hefesto CTO",
    agent: "hefesto",
    frequency: "Sob demanda",
    lastCheck: "2026-03-16T20:00:00Z",
    status: "healthy",
    nextExpected: "2026-03-17T20:00:00Z",
  },
  {
    id: "hb-afrodite",
    name: "Afrodite CMO",
    agent: "afrodite",
    frequency: "Sob demanda",
    lastCheck: "2026-03-16T14:00:00Z",
    status: "warning",
    nextExpected: "2026-03-17T14:00:00Z",
  },
  {
    id: "hb-apollo",
    name: "Apollo CCO",
    agent: "apollo",
    frequency: "Sob demanda",
    lastCheck: "2026-03-15T18:00:00Z",
    status: "critical",
    nextExpected: "2026-03-16T18:00:00Z",
  },
  {
    id: "hb-hera",
    name: "Hera COO",
    agent: "hera",
    frequency: "Sob demanda",
    lastCheck: "2026-03-17T09:00:00Z",
    status: "healthy",
    nextExpected: "2026-03-17T18:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function StatusBadge({ status, type }: { status: string; type: "cron" | "heartbeat" }) {
  const styles = {
    cron: {
      ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      disabled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    },
    heartbeat: {
      healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      critical: "bg-red-500/20 text-red-400 border-red-500/30",
      unknown: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    },
  };

  const icons = {
    cron: { ok: CheckCircle, error: XCircle, disabled: AlertCircle },
    heartbeat: { healthy: CheckCircle, warning: AlertCircle, critical: XCircle, unknown: AlertCircle },
  };

  const Icon = icons[type][status as keyof typeof icons[typeof type]] || AlertCircle;
  const style = styles[type][status as keyof typeof styles[typeof type]] || styles[type].disabled;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
      <Icon className="w-3.5 h-3.5" />
      {status === "ok" || status === "healthy" ? "OK" : status.toUpperCase()}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<"crons" | "heartbeats">("crons");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const errorCount = CRONS.filter(c => c.status === "error").length;
  const criticalHeartbeats = HEARTBEATS.filter(h => h.status === "critical").length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
              <Server className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Infraestrutura do Panteão</h1>
              <p className="text-zinc-500 text-sm">Crons, heartbeats e status do sistema</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-violet-400" />
              <span className="text-zinc-400 text-sm">Crons Ativos</span>
            </div>
            <div className="text-3xl font-bold">{CRONS.length}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-zinc-400 text-sm">Heartbeats</span>
            </div>
            <div className="text-3xl font-bold">{HEARTBEATS.length}</div>
          </div>
          <div className={`bg-zinc-900/50 border rounded-xl p-4 ${errorCount > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className={`w-5 h-5 ${errorCount > 0 ? "text-red-400" : "text-zinc-400"}`} />
              <span className="text-zinc-400 text-sm">Crons com Erro</span>
            </div>
            <div className={`text-3xl font-bold ${errorCount > 0 ? "text-red-400" : ""}`}>{errorCount}</div>
          </div>
          <div className={`bg-zinc-900/50 border rounded-xl p-4 ${criticalHeartbeats > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
            <div className="flex items-center gap-3 mb-2">
              <XCircle className={`w-5 h-5 ${criticalHeartbeats > 0 ? "text-red-400" : "text-zinc-400"}`} />
              <span className="text-zinc-400 text-sm">Agentes Críticos</span>
            </div>
            <div className={`text-3xl font-bold ${criticalHeartbeats > 0 ? "text-red-400" : ""}`}>{criticalHeartbeats}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab("crons")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "crons"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Crons Agendados
          </button>
          <button
            onClick={() => setActiveTab("heartbeats")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "heartbeats"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Activity className="w-4 h-4" />
            Heartbeats dos Agentes
          </button>
        </div>

        {/* Crons Table */}
        {activeTab === "crons" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50 border-b border-zinc-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Agendamento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Próxima Execução</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Última Execução</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {CRONS.map((cron) => (
                    <tr key={cron.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium">{cron.name}</div>
                        {cron.description && (
                          <div className="text-xs text-zinc-500 mt-0.5">{cron.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <code className="px-2 py-1 bg-zinc-800 rounded text-xs text-violet-300 font-mono">
                          {cron.schedule}
                        </code>
                        <div className="text-xs text-zinc-500 mt-1">{cron.tz}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDate(cron.nextRun)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {cron.lastRun ? (
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{formatDate(cron.lastRun)}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={cron.status} type="cron" />
                        {cron.consecutiveErrors > 0 && (
                          <div className="text-xs text-red-400 mt-1">
                            {cron.consecutiveErrors} erro(s) consecutivo(s)
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Heartbeats Table */}
        {activeTab === "heartbeats" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50 border-b border-zinc-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Agente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Frequência</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Último Check</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Próximo Esperado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {HEARTBEATS.map((hb) => (
                    <tr key={hb.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium">{hb.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">@{hb.agent}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-zinc-300">{hb.frequency}</span>
                      </td>
                      <td className="px-4 py-4">
                        {hb.lastCheck ? (
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{formatDate(hb.lastCheck)}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDate(hb.nextExpected)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={hb.status} type="heartbeat" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-500" />
            Legenda
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>OK / Saudável — funcionando normalmente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Atenção — fora do horário esperado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Erro / Crítico — requer intervenção</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span>Desconhecido / Desativado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
