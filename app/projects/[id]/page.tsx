"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, RefreshCw, CheckCircle, Clock, AlertCircle, Loader2, Link2 } from "lucide-react";

const VERTICAL_COLOR: Record<string, string> = {
  "STM Capital":     "#D4AF37",
  "STM Digital":     "#9B7EC8",
  "AgiSales":        "#06B6D4",
  "Interno":         "#8BA888",
  "STM Consultancy": "#4ADE80",
  "STM Health":      "#F472B6",
};

const STATUS_COLS = [
  { key: "backlog",     label: "Backlog",      color: "#71717A" },
  { key: "in_progress", label: "Em Progresso", color: "#60A5FA" },
  { key: "review",      label: "Em Review",    color: "#FBBF24" },
  { key: "blocked",     label: "Bloqueado",    color: "#F87171" },
  { key: "done",        label: "Concluído",    color: "#4ADE80" },
];

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🔍", hefesto: "⚒️", apollo: "🎭",
  afrodite: "💄", hera: "⚙️", ares: "⚔️", hestia: "🏠",
};

const PRIORITY_LABEL: Record<number, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const PRIORITY_COLOR: Record<number, string> = { 1: "text-red-400", 2: "text-amber-400", 3: "text-zinc-500" };

function timeAgo(d: string | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

interface Task { code: string; title: string; status: string; agent_id?: string; priority?: number; updated_at: string; completed_at?: string; deliverable_url?: string; }
interface Metrics { total: number; done: number; inProgress: number; review: number; blocked: number; backlog: number; progress: number; }
interface ProjectDetail { id: string; code: string; name: string; description?: string; vertical: string; status: string; lead_agent_id?: string; notion_url?: string; trello_url?: string; drive_url?: string; tasks: Task[]; metrics: Metrics; updated_at: string; }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Projeto não encontrado");
      const data = await res.json();
      setProject(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500 gap-4">
      <p>{error || "Projeto não encontrado"}</p>
      <button onClick={() => router.push("/projects")} className="text-sm text-zinc-400 hover:text-white underline">← Voltar</button>
    </div>
  );

  const vColor = VERTICAL_COLOR[project.vertical] || "#D4AF37";
  const m = project.metrics;
  const deliverables = project.tasks.filter(t => t.deliverable_url);
  const involvedAgents = [...new Set(project.tasks.map(t => t.agent_id).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <button onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar para Projetos
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold"
                  style={{ backgroundColor: vColor + "22", color: vColor }}>{project.code}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{project.vertical}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                  {project.status === "active" ? "● Ativo" : project.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              {project.description && <p className="text-zinc-400 mt-2 max-w-2xl">{project.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {project.notion_url && <a href={project.notion_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Notion"><ExternalLink size={14} /></a>}
              {project.trello_url && <a href={project.trello_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Trello"><ExternalLink size={14} /></a>}
              {project.drive_url && <a href={project.drive_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Drive"><ExternalLink size={14} /></a>}
              <button onClick={load} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors">
                <RefreshCw size={14} className="text-zinc-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Progresso geral</p>
            <p className="text-3xl font-bold" style={{ color: vColor }}>{m.progress}%</p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${m.progress}%`, backgroundColor: vColor }} />
            </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total de tasks</p>
            <p className="text-3xl font-bold text-white">{m.total}</p>
            <p className="text-xs text-zinc-600 mt-1">{m.backlog} no backlog</p>
          </div>
          <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Concluídas</p>
            <p className="text-3xl font-bold text-emerald-400">{m.done}</p>
            <p className="text-xs text-zinc-600 mt-1">{m.inProgress} em andamento</p>
          </div>
          <div className={`bg-zinc-900/60 border rounded-xl p-4 ${m.blocked > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
            <p className="text-xs text-zinc-500 mb-1">Bloqueadas</p>
            <p className={`text-3xl font-bold ${m.blocked > 0 ? "text-red-400" : "text-zinc-600"}`}>{m.blocked}</p>
            <p className="text-xs text-zinc-600 mt-1">{m.review} em review</p>
          </div>
        </div>

        {/* Timeline de tasks por status */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-4">Tasks do Projeto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {STATUS_COLS.map(col => {
              const colTasks = project.tasks.filter(t => t.status === col.key);
              return (
                <div key={col.key} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                    <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-400">{colTasks.length}</span>
                  </div>
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-zinc-700 italic text-center py-4">vazio</p>
                  ) : (
                    <ul className="space-y-2">
                      {colTasks.slice(0, 8).map(t => (
                        <li key={t.code} className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-mono text-xs text-zinc-600">{t.code}</span>
                            {t.agent_id && <span className="text-sm">{AGENT_EMOJI[t.agent_id] || "🤖"}</span>}
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-2">{t.title}</p>
                          <p className="text-xs text-zinc-600 mt-1">{timeAgo(t.updated_at)}</p>
                          {t.deliverable_url && (
                            <a href={t.deliverable_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs mt-1 hover:underline" style={{ color: col.color }}>
                              <Link2 size={10} /> entrega
                            </a>
                          )}
                        </li>
                      ))}
                      {colTasks.length > 8 && <p className="text-xs text-zinc-600 text-center">+{colTasks.length - 8} mais</p>}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agentes + Entregas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agentes envolvidos */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Agentes Envolvidos</h3>
            <div className="flex flex-wrap gap-2">
              {involvedAgents.length === 0 ? (
                <p className="text-xs text-zinc-600">Nenhum agente atribuído</p>
              ) : involvedAgents.map(a => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
                  <span>{AGENT_EMOJI[a!] || "🤖"}</span>
                  <span className="text-zinc-300 capitalize">{a}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Entregas */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Entregas com Link ({deliverables.length})</h3>
            {deliverables.length === 0 ? (
              <p className="text-xs text-zinc-600">Nenhuma entrega com link ainda</p>
            ) : (
              <ul className="space-y-2">
                {deliverables.slice(0, 5).map(t => (
                  <li key={t.code} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-600 shrink-0">{t.code}</span>
                    <span className="text-xs text-zinc-400 flex-1 line-clamp-1">{t.title}</span>
                    <a href={t.deliverable_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1 hover:text-white text-zinc-500 transition-colors">
                      <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
                {deliverables.length > 5 && <p className="text-xs text-zinc-600">+{deliverables.length - 5} mais</p>}
              </ul>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-700 text-right">Última atualização: {timeAgo(project.updated_at)}</p>
      </div>
    </div>
  );
}
