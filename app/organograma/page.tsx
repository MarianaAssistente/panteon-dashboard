"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// ─── Static metadata ────────────────────────────────────────────────────────
const AGENT_META: Record<
  string,
  { role: string; model: string; color: string; icon: string }
> = {
  mariana:  { role: "CEO",  model: "claude-sonnet-4-6", color: "#D4AF37", icon: "👑" },
  atena:    { role: "CSO",  model: "claude-sonnet-4-6", color: "#60A5FA", icon: "🔍" },
  hefesto:  { role: "CTO",  model: "claude-sonnet-4-6", color: "#FB923C", icon: "⚒️" },
  ares:     { role: "CQO",  model: "claude-sonnet-4-6", color: "#F87171", icon: "⚔️" },
  hera:     { role: "COO",  model: "claude-haiku-4-5",  color: "#34D399", icon: "⚙️" },
  afrodite: { role: "CMO",  model: "claude-haiku-4-5",  color: "#F472B6", icon: "💄" },
  apollo:   { role: "CCO",  model: "claude-haiku-4-5",  color: "#A78BFA", icon: "🎭" },
  hestia:   { role: "CPA",  model: "claude-haiku-4-5",  color: "#2DD4BF", icon: "🏠" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

const STATUS_CONFIG = {
  working: { label: "Ativo",    bg: "bg-green-500",  text: "text-green-400",  pulse: true  },
  idle:    { label: "Idle",     bg: "bg-amber-500",  text: "text-amber-400",  pulse: false },
  standby: { label: "Standby",  bg: "bg-zinc-500",   text: "text-zinc-400",   pulse: false },
  blocked: { label: "Bloqueado",bg: "bg-red-500",    text: "text-red-400",    pulse: false },
} as const;

type AgentStatus = keyof typeof STATUS_CONFIG;

interface ActiveTask {
  code: string;
  title: string;
  status: string;
  priority: number;
  updated_at: string;
}

interface Agent {
  id: string;
  name: string;
  activeTasks: ActiveTask[];
  status: AgentStatus;
  lastActivityAt: string | null;
}

// ─── Avatar component ────────────────────────────────────────────────────────
function AgentAvatar({
  id,
  name,
  color,
  icon,
}: {
  id: string;
  name: string;
  color: string;
  icon: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2"
        style={{ borderColor: color, backgroundColor: color + "22" }}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: color }}>
      <Image
        src={`/avatars/${id}.png`}
        alt={name}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Dispatch Modal ──────────────────────────────────────────────────────────
function DispatchModal({
  agents,
  defaultAgentId,
  onClose,
}: {
  agents: Agent[];
  defaultAgentId: string;
  onClose: () => void;
}) {
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit() {
    if (!task.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, task }),
      });
      const data = await res.json();
      setResult(data.message || data.error || "Enviado!");
    } catch {
      setResult("Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#D4AF37" }}>
          ▶ Disparar Agente
        </h2>

        {result ? (
          <div className="text-center py-4">
            <p className="text-green-400 text-sm mb-4">{result}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1">Agente destino</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {agents.map((ag) => {
                  const meta = AGENT_META[ag.id] || {};
                  return (
                    <option key={ag.id} value={ag.id}>
                      {meta.icon} {ag.name} — {(meta as any).role}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-zinc-400 mb-1">Descreva a tarefa</label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                placeholder="Ex: Revisar o módulo de autenticação e criar testes unitários..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !task.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#D4AF37", color: "#000" }}
              >
                {loading ? "Enviando…" : "▶ Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onDispatch,
}: {
  agent: Agent;
  onDispatch: (id: string) => void;
}) {
  const meta = AGENT_META[agent.id] || {
    role: "Agente",
    model: "—",
    color: "#888",
    icon: "🤖",
  };
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.standby;
  const visibleTasks = agent.activeTasks.slice(0, 3);
  const extraCount = agent.activeTasks.length - visibleTasks.length;

  return (
    <div
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg group"
      style={
        {
          "--agent-color": meta.color,
        } as React.CSSProperties
      }
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = meta.color + "88")
      }
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <AgentAvatar id={agent.id} name={agent.name} color={meta.color} icon={meta.icon} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white capitalize">{agent.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.color + "33", color: meta.color }}>
              {meta.role}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{meta.model}</p>
        </div>
      </div>

      {/* Status + last activity */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${statusCfg.bg} ${
              statusCfg.pulse ? "animate-pulse" : ""
            }`}
          />
          <span className={statusCfg.text}>{statusCfg.label}</span>
        </div>
        <span className="text-zinc-500">
          {timeAgo(agent.lastActivityAt)}
        </span>
      </div>

      {/* Active tasks */}
      <div className="flex-1">
        {agent.activeTasks.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Nenhuma task ativa</p>
        ) : (
          <ul className="space-y-1.5">
            {visibleTasks.map((t) => (
              <li key={t.code} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-zinc-500 shrink-0">{t.code}</span>
                <span className="text-zinc-300 line-clamp-1">{t.title}</span>
              </li>
            ))}
            {extraCount > 0 && (
              <li className="text-xs text-zinc-500">+{extraCount} mais</li>
            )}
          </ul>
        )}
      </div>

      {/* Action */}
      <button
        onClick={() => onDispatch(agent.id)}
        className="w-full text-xs font-medium py-1.5 rounded-lg border transition-colors hover:text-black"
        style={{
          borderColor: meta.color,
          color: meta.color,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = meta.color;
          e.currentTarget.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "";
          e.currentTarget.style.color = meta.color;
        }}
      >
        ▶ Disparar
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrganogramaPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchTarget, setDispatchTarget] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.agents) {
        setAgents(data.agents);
        setFetchedAt(data.fetchedAt);
      }
    } catch (e) {
      console.error("Erro ao buscar agentes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30_000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const working = agents.filter((a) => a.status === "working").length;
  const standby = agents.filter((a) => a.status === "standby").length;
  const blocked = agents.filter((a) => a.status === "blocked").length;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#D4AF37" }}>
              Agentes do Panteão
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              <span className="text-green-400">{working} ativos</span>
              {" · "}
              <span className="text-zinc-400">{standby} standby</span>
              {" · "}
              <span className="text-red-400">{blocked} bloqueados</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {fetchedAt && (
              <span className="text-xs text-zinc-600">
                Atualizado {timeAgo(fetchedAt)}
              </span>
            )}
            <button
              onClick={() => { setLoading(true); fetchAgents(); }}
              className="px-4 py-2 rounded-lg text-sm border border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto">
        {loading && agents.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-52 animate-pulse"
              />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            Nenhum agente encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDispatch={(id) => setDispatchTarget(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {dispatchTarget && (
        <DispatchModal
          agents={agents}
          defaultAgentId={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
        />
      )}
    </div>
  );
}
