"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, FolderOpen, ArrowRight } from "lucide-react";

const VERTICAL_COLOR: Record<string, string> = {
  "STM Capital":     "#D4AF37",
  "STM Digital":     "#9B7EC8",
  "AgiSales":        "#06B6D4",
  "Interno":         "#8BA888",
  "STM Consultancy": "#4ADE80",
  "STM Health":      "#F472B6",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Ativo",     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  paused:    { label: "Pausado",   color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  completed: { label: "Concluído", color: "text-zinc-400",    bg: "bg-zinc-500/10 border-zinc-500/30" },
  cancelled: { label: "Cancelado", color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
};

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🔍", hefesto: "⚒️", apollo: "🎭",
  afrodite: "💄", hera: "⚙️", ares: "⚔️", hestia: "🏠",
};

interface ProjectMetrics { total: number; done: number; inProgress: number; review: number; blocked: number; backlog: number; progress: number; }
interface Project { id: string; code: string; name: string; description?: string; vertical: string; status: string; lead_agent_id?: string; priority: number; metrics?: ProjectMetrics; }

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full bg-zinc-800 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const vColor = VERTICAL_COLOR[project.vertical] || "#888";
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const m = project.metrics;

  return (
    <div onClick={onClick}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl flex flex-col gap-4 group"
      onMouseEnter={e => e.currentTarget.style.borderColor = vColor + "66"}
      onMouseLeave={e => e.currentTarget.style.borderColor = ""}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: vColor + "22", color: vColor }}>
              {project.code}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <h3 className="font-bold text-white text-sm leading-snug">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <ArrowRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 mt-1" />
      </div>

      {/* Progresso */}
      {m && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Progresso</span>
            <span className="font-bold" style={{ color: vColor }}>{m.progress}%</span>
          </div>
          <ProgressBar percent={m.progress} color={vColor} />
          <div className="flex gap-3 text-xs text-zinc-500 flex-wrap">
            <span>{m.total} tasks</span>
            {m.inProgress > 0 && <span className="text-blue-400">↻ {m.inProgress} em andamento</span>}
            {m.review > 0 && <span className="text-amber-400">👁 {m.review} em review</span>}
            {m.blocked > 0 && <span className="text-red-400">⛔ {m.blocked} bloqueadas</span>}
            <span className="text-emerald-400">✓ {m.done} concluídas</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="text-base">{AGENT_EMOJI[project.lead_agent_id || ""] || "🤖"}</span>
          <span>{project.lead_agent_id || "—"}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: vColor + "15", color: vColor }}>
          {project.vertical}
        </span>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskMetrics, setTaskMetrics] = useState<Record<string, ProjectMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [filterVertical, setFilterVertical] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");

  async function load() {
    setLoading(true);
    const SVC = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const [projRes, tasksRes] = await Promise.all([
      fetch(`${URL}/rest/v1/projects?select=*&order=priority.asc`, { headers: { apikey: SVC!, Authorization: `Bearer ${SVC}` } }),
      fetch(`${URL}/rest/v1/tasks?select=project_code,status`, { headers: { apikey: SVC!, Authorization: `Bearer ${SVC}` } }),
    ]);

    const projs: Project[] = await projRes.json();
    const tasks: { project_code: string; status: string }[] = await tasksRes.json();

    // Calcular métricas por projeto
    const metrics: Record<string, ProjectMetrics> = {};
    if (Array.isArray(tasks)) {
      tasks.forEach(t => {
        if (!t.project_code) return;
        if (!metrics[t.project_code]) metrics[t.project_code] = { total: 0, done: 0, inProgress: 0, review: 0, blocked: 0, backlog: 0, progress: 0 };
        const m = metrics[t.project_code];
        m.total++;
        if (t.status === "done") m.done++;
        else if (t.status === "in_progress") m.inProgress++;
        else if (t.status === "review") m.review++;
        else if (t.status === "blocked") m.blocked++;
        else if (t.status === "backlog") m.backlog++;
      });
      Object.keys(metrics).forEach(code => {
        const m = metrics[code];
        m.progress = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
      });
    }

    setProjects(Array.isArray(projs) ? projs : []);
    setTaskMetrics(metrics);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => projects
    .filter(p => filterVertical === "Todos" || p.vertical === filterVertical)
    .filter(p => filterStatus === "Todos" || p.status === filterStatus)
    .map(p => ({ ...p, metrics: taskMetrics[p.code] })),
    [projects, taskMetrics, filterVertical, filterStatus]);

  const activeCount = projects.filter(p => p.status === "active").length;
  const verticals = ["Todos", ...Array.from(new Set(projects.map(p => p.vertical)))];
  const statuses = ["Todos", "active", "paused", "completed", "cancelled"];
  const STATUS_LABELS: Record<string, string> = { active: "Ativo", paused: "Pausado", completed: "Concluído", cancelled: "Cancelado" };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#D4AF37" }}>Projetos</h1>
            <p className="text-sm text-zinc-500 mt-1">{activeCount} projetos ativos</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none">
              {verticals.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none">
              {statuses.map(s => <option key={s} value={s}>{s === "Todos" ? "Todos os status" : STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={load} disabled={loading}
              className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin text-zinc-400" : "text-zinc-400"} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <FolderOpen size={40} className="mb-3" />
            <p>Nenhum projeto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => router.push(`/projects/${p.code || p.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
