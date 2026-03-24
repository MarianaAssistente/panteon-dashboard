"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const AGENT_META: Record<string, { role: string; model: string; color: string; icon: string; description: string; specialties: string[] }> = {
  mariana:  { role: "CEO",  model: "claude-sonnet-4-6", color: "#D4AF37", icon: "👑", description: "Coordenadora geral do Panteão. Recebe demandas do Yuri, decompõe em tarefas e delega para os agentes corretos.", specialties: ["Coordenação estratégica", "Delegação de tarefas", "Gestão de projetos", "Comunicação com Yuri"] },
  atena:    { role: "CSO",  model: "claude-sonnet-4-6", color: "#60A5FA", icon: "🔍", description: "Chief Strategy Officer. Especialista em pesquisa, análise de mercado e inteligência estratégica.", specialties: ["Pesquisa de mercado", "Análise de dados", "Inteligência competitiva", "Relatórios estratégicos"] },
  hefesto:  { role: "CTO",  model: "claude-sonnet-4-6", color: "#FB923C", icon: "⚒️", description: "Chief Technology Officer. Responsável por código, infraestrutura, deploys e soluções técnicas.", specialties: ["Desenvolvimento web", "APIs e integrações", "Deploy e DevOps", "Arquitetura de sistemas"] },
  ares:     { role: "CQO",  model: "claude-sonnet-4-6", color: "#F87171", icon: "⚔️", description: "Chief Quality Officer. Garante a qualidade das entregas, faz revisões e testes.", specialties: ["Code review", "QA e testes", "Auditoria de qualidade", "Validação de entregas"] },
  hera:     { role: "COO",  model: "claude-haiku-4-5",  color: "#34D399", icon: "⚙️", description: "Chief Operations Officer. Gerencia operações, processos e coordenação entre equipes.", specialties: ["Gestão de processos", "Coordenação operacional", "Prazos e cronogramas", "Sincronização Notion/Trello"] },
  afrodite: { role: "CMO",  model: "claude-haiku-4-5",  color: "#F472B6", icon: "💄", description: "Chief Marketing Officer. Responsável por conteúdo, copy, campanhas e estratégia de marketing.", specialties: ["Copy e conteúdo", "Campanhas de marketing", "Briefings criativos", "Instagram e redes sociais"] },
  apollo:   { role: "CCO",  model: "claude-haiku-4-5",  color: "#A78BFA", icon: "🎭", description: "Chief Content Officer. Especialista em redação, roteiros, e-books e produção de conteúdo.", specialties: ["Redação e roteiros", "E-books e materiais", "Posts e artigos", "Produção audiovisual"] },
  hestia:   { role: "CPA",  model: "claude-haiku-4-5",  color: "#2DD4BF", icon: "🏠", description: "Chief Personal Assistant. Cuida da agenda pessoal, viagens e tarefas administrativas do Yuri.", specialties: ["Agenda pessoal", "Organização de viagens", "E-mails e comunicações", "Tarefas administrativas"] },
};

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
  working: { label: "Ativo",     bg: "bg-green-500",  text: "text-green-400",  pulse: true  },
  idle:    { label: "Idle",      bg: "bg-amber-500",  text: "text-amber-400",  pulse: false },
  standby: { label: "Standby",   bg: "bg-zinc-500",   text: "text-zinc-400",   pulse: false },
  blocked: { label: "Bloqueado", bg: "bg-red-500",    text: "text-red-400",    pulse: false },
} as const;
type AgentStatus = keyof typeof STATUS_CONFIG;

interface ActiveTask { code: string; title: string; status: string; priority: number; updated_at: string; }
interface Agent { id: string; name: string; activeTasks: ActiveTask[]; status: AgentStatus; lastActivityAt: string | null; lastTaskTitle: string | null; }

// ─── Avatar ──────────────────────────────────────────────────────────────────
function AgentAvatar({ id, name, color, icon, size = 16 }: { id: string; name: string; color: string; icon: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const px = size === 16 ? "w-16 h-16" : "w-24 h-24";
  if (imgError) {
    return (
      <div className={`${px} rounded-full flex items-center justify-center text-2xl font-bold border-2`}
        style={{ borderColor: color, backgroundColor: color + "22" }}>
        {icon}
      </div>
    );
  }
  return (
    <div className={`relative ${px} rounded-full overflow-hidden border-2 shrink-0`} style={{ borderColor: color }}>
      <Image src={`/avatars/avatar-${id}.png`} alt={name} fill className="object-cover" onError={() => setImgError(true)} />
    </div>
  );
}

// ─── Detail Panel (drawer lateral) ───────────────────────────────────────────
function AgentDetailPanel({ agent, onClose, onDispatch }: { agent: Agent; onClose: () => void; onDispatch: () => void }) {
  const meta = AGENT_META[agent.id] || { role: "Agente", model: "—", color: "#888", icon: "🤖", description: "", specialties: [] };
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.standby;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-zinc-950 border-l border-zinc-800 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start gap-4">
          <AgentAvatar id={agent.id} name={agent.name} color={meta.color} icon={meta.icon} size={24} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: meta.color + "33", color: meta.color }}>{meta.role}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{meta.model}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${statusCfg.bg} ${statusCfg.pulse ? "animate-pulse" : ""}`} />
              <span className={`text-xs ${statusCfg.text}`}>{statusCfg.label}</span>
              <span className="text-xs text-zinc-600 ml-1">· última atividade {timeAgo(agent.lastActivityAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none mt-1">✕</button>
        </div>

        {/* Descrição */}
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Sobre</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{meta.description}</p>
        </div>

        {/* Especialidades */}
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Especialidades</h3>
          <div className="flex flex-wrap gap-2">
            {meta.specialties.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: meta.color + "55", color: meta.color, backgroundColor: meta.color + "11" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Tasks ativas */}
        <div className="p-6 border-b border-zinc-800 flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Tasks ativas ({agent.activeTasks.length})
          </h3>
          {agent.activeTasks.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">
              {agent.lastTaskTitle ? `Última: ${agent.lastTaskTitle}` : "Nenhuma task ativa no momento"}
            </p>
          ) : (
            <ul className="space-y-2">
              {agent.activeTasks.map((t) => (
                <li key={t.code} className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="font-mono text-xs text-zinc-500 shrink-0 mt-0.5">{t.code}</span>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200">{t.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">atualizado {timeAgo(t.updated_at)}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${t.status === "review" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {t.status === "review" ? "review" : "em andamento"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ação */}
        <div className="p-6">
          <button
            onClick={onDispatch}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: meta.color, color: "#000" }}
          >
            ▶ Disparar tarefa para {agent.name}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Dispatch Modal ───────────────────────────────────────────────────────────
function DispatchModal({ agents, defaultAgentId, onClose }: { agents: Agent[]; defaultAgentId: string; onClose: () => void; }) {
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

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
      setResult({ ok: !!data.ok, message: data.message || data.error || "Resposta desconhecida" });
    } catch {
      setResult({ ok: false, message: "Erro de conexão ao enviar tarefa." });
    } finally {
      setLoading(false);
    }
  }

  const meta = AGENT_META[agentId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#D4AF37" }}>▶ Disparar Agente</h2>

        {result ? (
          <div className="text-center py-6 space-y-4">
            <div className={`text-5xl`}>{result.ok ? "✅" : "❌"}</div>
            <p className={`text-sm font-medium ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.message}</p>
            {result.ok && (
              <div className="p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400 text-left">
                <p className="font-semibold text-zinc-300 mb-1">Como acompanhar:</p>
                <p>• A task aparecerá na <strong>Fila de Tarefas</strong> em instantes</p>
                <p>• O agente ficará com status <span className="text-green-400">Ativo</span> ao iniciar</p>
                <p>• Você receberá update no grupo Telegram quando concluir</p>
              </div>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1">Agente destino</label>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500">
                {agents.map((ag) => {
                  const m = AGENT_META[ag.id];
                  return <option key={ag.id} value={ag.id}>{m?.icon} {ag.name} — {m?.role}</option>;
                })}
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-xs text-zinc-400 mb-1">Descreva a tarefa</label>
              <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={4}
                placeholder={`Ex: ${meta?.specialties[0] || "Descreva o que precisa ser feito"}...`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">Cancelar</button>
              <button onClick={handleSubmit} disabled={loading || !task.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#D4AF37", color: "#000" }}>
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
function AgentCard({ agent, onSelect, onDispatch }: { agent: Agent; onSelect: () => void; onDispatch: () => void; }) {
  const meta = AGENT_META[agent.id] || { role: "Agente", model: "—", color: "#888", icon: "🤖", description: "", specialties: [] };
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.standby;
  const visibleTasks = agent.activeTasks.slice(0, 2);
  const extraCount = agent.activeTasks.length - visibleTasks.length;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-opacity-80 cursor-pointer group"
      style={{ "--agent-color": meta.color } as React.CSSProperties}
      onClick={onSelect}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = meta.color + "66"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <AgentAvatar id={agent.id} name={agent.name} color={meta.color} icon={meta.icon} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white">{agent.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.color + "33", color: meta.color }}>{meta.role}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{meta.model}</p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusCfg.bg} ${statusCfg.pulse ? "animate-pulse" : ""}`} />
          <span className={statusCfg.text}>{statusCfg.label}</span>
        </div>
        <span className="text-zinc-500">{timeAgo(agent.lastActivityAt)}</span>
      </div>

      {/* Tasks */}
      <div className="flex-1 min-h-[40px]">
        {agent.activeTasks.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">
            {agent.lastTaskTitle ? `↩ ${agent.lastTaskTitle}` : "Nenhuma task ativa"}
          </p>
        ) : (
          <ul className="space-y-1">
            {visibleTasks.map((t) => (
              <li key={t.code} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-zinc-600 shrink-0">{t.code}</span>
                <span className="text-zinc-300 line-clamp-1">{t.title}</span>
              </li>
            ))}
            {extraCount > 0 && <li className="text-xs text-zinc-500">+{extraCount} mais</li>}
          </ul>
        )}
      </div>

      {/* Botão */}
      <button onClick={(e) => { e.stopPropagation(); onDispatch(); }}
        className="w-full text-xs font-medium py-1.5 rounded-lg border transition-all"
        style={{ borderColor: meta.color, color: meta.color }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = meta.color; e.currentTarget.style.color = "#000"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = meta.color; }}>
        ▶ Disparar
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrganogramaPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.agents) { setAgents(data.agents); setFetchedAt(data.fetchedAt); }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAgents();
    const i = setInterval(fetchAgents, 30_000);
    return () => clearInterval(i);
  }, [fetchAgents]);

  const working = agents.filter((a) => a.status === "working").length;
  const standby = agents.filter((a) => a.status === "standby").length;
  const blocked = agents.filter((a) => a.status === "blocked").length;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#D4AF37" }}>Agentes do Panteão</h1>
            <p className="text-sm mt-1">
              <span className="text-green-400">{working} ativos</span>
              {" · "}
              <span className="text-zinc-400">{standby} standby</span>
              {" · "}
              <span className="text-red-400">{blocked} bloqueados</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {fetchedAt && <span className="text-xs text-zinc-600">Atualizado {timeAgo(fetchedAt)}</span>}
            <button onClick={() => { setLoading(true); fetchAgents(); }} className="px-4 py-2 rounded-lg text-sm border border-zinc-700 hover:border-zinc-500 transition-colors">↻ Atualizar</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading && agents.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-52 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent}
                onSelect={() => setSelectedAgent(agent)}
                onDispatch={() => { setSelectedAgent(null); setDispatchTarget(agent.id); }} />
            ))}
          </div>
        )}
      </div>

      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onDispatch={() => { setSelectedAgent(null); setDispatchTarget(selectedAgent.id); }} />
      )}

      {dispatchTarget && (
        <DispatchModal agents={agents} defaultAgentId={dispatchTarget} onClose={() => setDispatchTarget(null)} />
      )}
    </div>
  );
}
