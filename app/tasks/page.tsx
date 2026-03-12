"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, ExternalLink, Link2, AlertCircle, Clock, CheckCircle, Loader2, GitBranch } from "lucide-react";

const STATUS_COLUMNS = [
  { key: "in_progress", label: "Em Progresso",  dot: "bg-blue-400",   color: "#60A5FA" },
  { key: "review",      label: "Em Review",      dot: "bg-yellow-400", color: "#FBBF24" },
  { key: "blocked",     label: "Bloqueado",       dot: "bg-red-400",    color: "#F87171" },
  { key: "backlog",     label: "Backlog",         dot: "bg-zinc-500",   color: "#71717A" },
  { key: "done",        label: "Concluído",       dot: "bg-green-400",  color: "#4ADE80" },
];

const PROJECT_COLORS: Record<string, string> = {
  "CAP-001": "#D4AF37",
  "CAP-002": "#B8962E",
  "CAP-003": "#C8A84B",
  "DIG-001": "#9B7EC8",
  "DIG-002": "#7C5CBF",
  "DIG-003": "#B09AD6",
  "AGI-001": "#06B6D4",
  "INT-001": "#8BA888",
};

const VERTICAL_COLOR: Record<string, string> = {
  "STM Capital":     "#D4AF37",
  "STM Digital":     "#9B7EC8",
  "AgiSales":        "#06B6D4",
  "Interno":         "#8BA888",
  "STM Consultancy": "#4ADE80",
  "STM Health":      "#F472B6",
};

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};

const PRIORITY_COLOR: Record<number, string> = { 1: "#EF4444", 2: "#F59E0B", 3: "#71717A" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("tasks").select("*").order("priority").order("updated_at", { ascending: false });
    if (filterAgent)    q = q.eq("agent_id", filterAgent);
    if (filterVertical) q = q.eq("vertical", filterVertical);
    if (filterProject)  q = q.eq("project_code", filterProject);
    const { data } = await q;
    setTasks(data ?? []);
    setLoading(false);
  }, [filterAgent, filterVertical, filterProject]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const grouped: Record<string, any[]> = {};
  for (const col of STATUS_COLUMNS) grouped[col.key] = [];
  for (const t of tasks) {
    const key = t.status in grouped ? t.status : "backlog";
    grouped[key].push(t);
  }

  // Build code→task map for dependency lookup
  const taskByCode: Record<string, any> = {};
  for (const t of tasks) if (t.code) taskByCode[t.code] = t;

  // Which tasks depend ON this task
  const dependents: Record<string, string[]> = {};
  for (const t of tasks) {
    for (const dep of (t.depends_on ?? [])) {
      if (!dependents[dep]) dependents[dep] = [];
      dependents[dep].push(t.code);
    }
  }

  const projectCodes = Array.from(new Set(tasks.map((t: any) => t.project_code).filter(Boolean))).sort() as string[];

  return (
    <>
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#F5F5F5]">Fila de Tarefas</h1>
            <p className="text-[#F5F5F5]/40 text-sm mt-0.5">{tasks.length} tarefas · clique para detalhar</p>
          </div>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              className="bg-[#111] border border-[#D4AF37]/15 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none">
              <option value="">Todos os agentes</option>
              {["mariana","atena","hefesto","apollo","afrodite","hera","ares","hestia"].map(a => (
                <option key={a} value={a}>{AGENT_EMOJI[a]} {a}</option>
              ))}
            </select>
            <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)}
              className="bg-[#111] border border-[#D4AF37]/15 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none">
              <option value="">Todas verticais</option>
              {Object.keys(VERTICAL_COLOR).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {projectCodes.length > 0 && (
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="bg-[#111] border border-[#D4AF37]/15 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none">
                <option value="">Todos os projetos</option>
                {projectCodes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {(filterAgent || filterVertical || filterProject) && (
              <button onClick={() => { setFilterAgent(""); setFilterVertical(""); setFilterProject(""); }}
                className="text-xs text-[#D4AF37]/50 hover:text-[#D4AF37] px-2">Limpar ×</button>
            )}
          </div>
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="text-[#D4AF37]/40 animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map(col => (
              <div key={col.key} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-semibold text-[#F5F5F5]/60 uppercase tracking-wider">{col.label}</span>
                  <span className="ml-auto text-[10px] text-[#F5F5F5]/30 bg-[#111] px-2 py-0.5 rounded-full border border-[#D4AF37]/8">
                    {grouped[col.key].length}
                  </span>
                </div>
                {/* Cards */}
                <div className="space-y-2">
                  {grouped[col.key].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      dependsOnTasks={(task.depends_on ?? []).map((c: string) => taskByCode[c]).filter(Boolean)}
                      blockedByThis={dependents[task.code] ?? []}
                      onClick={() => setSelected(task)}
                    />
                  ))}
                  {grouped[col.key].length === 0 && (
                    <div className="h-16 rounded-xl border border-dashed border-[#D4AF37]/8 flex items-center justify-center">
                      <span className="text-[10px] text-[#F5F5F5]/15">vazio</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel — overlay fixo (fora do flex, no nível raiz) */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSelected(null)}
          />
          <TaskDetailPanel
            task={selected}
            dependsOnTasks={(selected.depends_on ?? []).map((c: string) => taskByCode[c]).filter(Boolean)}
            blockedByThis={(dependents[selected.code] ?? []).map(c => taskByCode[c]).filter(Boolean)}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </>
  );
}

function TaskCard({ task, dependsOnTasks, blockedByThis, onClick }: {
  task: any; dependsOnTasks: any[]; blockedByThis: string[]; onClick: () => void;
}) {
  const projColor = PROJECT_COLORS[task.project_code] || VERTICAL_COLOR[task.vertical] || "#D4AF37";

  return (
    <button onClick={onClick}
      className="w-full text-left bg-[#111] border border-[#D4AF37]/8 hover:border-[#D4AF37]/25 rounded-xl overflow-hidden transition-all duration-150 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20">
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.code && (
              <span className="text-[10px] font-mono text-[#D4AF37]/40">{task.code}</span>
            )}
            {task.priority && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLOR[task.priority] }} />
            )}
          </div>
          <span className="text-[10px] text-[#F5F5F5]/25 flex-shrink-0">
            {task.agent_id ? AGENT_EMOJI[task.agent_id] : ""}
          </span>
        </div>

        {/* Title */}
        <p className="text-xs font-medium text-[#F5F5F5]/85 leading-snug line-clamp-2 mb-2">{task.title}</p>

        {/* Dependencies */}
        {dependsOnTasks.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <Link2 size={9} className="text-[#F59E0B]/50" />
            <span className="text-[10px] text-[#F59E0B]/50">
              depende: {dependsOnTasks.map(t => t.code).join(", ")}
            </span>
          </div>
        )}
        {blockedByThis.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <GitBranch size={9} className="text-[#7B9EA8]/50" />
            <span className="text-[10px] text-[#7B9EA8]/50">
              bloqueia: {blockedByThis.slice(0,2).join(", ")}{blockedByThis.length > 2 ? ` +${blockedByThis.length-2}` : ""}
            </span>
          </div>
        )}

        {/* Time */}
        <p className="text-[10px] text-[#F5F5F5]/25">
          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>

      {/* Project color stripe */}
      <div className="h-2 w-full mx-0 rounded-b-xl" style={{ backgroundColor: projColor }} />
    </button>
  );
}

function TaskDetailPanel({ task, dependsOnTasks, blockedByThis, onClose }: {
  task: any; dependsOnTasks: any[]; blockedByThis: any[]; onClose: () => void;
}) {
  const projColor = PROJECT_COLORS[task.project_code] || VERTICAL_COLOR[task.vertical] || "#D4AF37";
  const statusCol = STATUS_COLUMNS.find(s => s.key === task.status);

  return (
    <aside className="drawer-slide-in fixed top-0 right-0 h-full w-full max-w-[440px] bg-[#0D0D0D] border-l border-[#D4AF37]/15 flex flex-col overflow-y-auto z-50 shadow-2xl shadow-black/60">
      {/* Color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: projColor }} />

      {/* Header */}
      <div className="p-5 border-b border-[#D4AF37]/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {task.code && <span className="text-[10px] font-mono text-[#D4AF37]/50">{task.code}</span>}
              {task.project_code && (
                <span className="text-[10px] px-2 py-0.5 rounded border"
                  style={{ color: projColor, borderColor: `${projColor}30`, backgroundColor: `${projColor}10` }}>
                  {task.project_code}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded border"
                style={{ color: statusCol?.color, borderColor: `${statusCol?.color}30`, backgroundColor: `${statusCol?.color}10` }}>
                {statusCol?.label}
              </span>
              {task.approval_status === "approved" && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">✓ Aprovado</span>
              )}
              {task.approval_status === "rejected" && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 border border-red-400/20 text-red-400">✗ Rejeitado</span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] leading-snug">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#F5F5F5]/35">
          {task.agent_id && <span>{AGENT_EMOJI[task.agent_id]} {task.agent_id}</span>}
          {task.vertical && <span style={{ color: `${VERTICAL_COLOR[task.vertical]}80` }}>{task.vertical}</span>}
          {task.priority && <span style={{ color: PRIORITY_COLOR[task.priority] }}>P{task.priority}</span>}
          {task.execution_time_minutes && <span><Clock size={10} className="inline mr-1" />{task.execution_time_minutes}min</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Description */}
        {task.description && (
          <Section title="Descrição">
            <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{task.description}</p>
          </Section>
        )}

        {/* Detail / how it's being done */}
        {task.detail && (
          <Section title="Como está sendo feito">
            <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{task.detail}</p>
          </Section>
        )}

        {/* Feedback */}
        {task.feedback && (
          <Section title="Feedback do Yuri">
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl p-3">
              <p className="text-sm text-[#F5F5F5]/65 leading-relaxed">{task.feedback}</p>
            </div>
          </Section>
        )}

        {/* Dependencies */}
        {dependsOnTasks.length > 0 && (
          <Section title="Depende de">
            <div className="space-y-2">
              {dependsOnTasks.map(dep => (
                <DepCard key={dep.id} task={dep} type="depends" />
              ))}
            </div>
          </Section>
        )}

        {blockedByThis.length > 0 && (
          <Section title="Desbloqueia">
            <div className="space-y-2">
              {blockedByThis.map(dep => (
                <DepCard key={dep.id} task={dep} type="blocks" />
              ))}
            </div>
          </Section>
        )}

        {/* Deliverable */}
        {task.deliverable_url && (
          <Section title="Entregável">
            <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">
              <ExternalLink size={12} /> {task.deliverable_url.replace("https://","").slice(0,50)}
            </a>
          </Section>
        )}

        {/* Timestamps */}
        <div className="text-[10px] text-[#F5F5F5]/20 space-y-1 pt-2 border-t border-[#D4AF37]/8">
          <p>Criado: {new Date(task.created_at).toLocaleDateString("pt-BR")}</p>
          <p>Atualizado: {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}</p>
          {task.completed_at && <p>Concluído: {new Date(task.completed_at).toLocaleDateString("pt-BR")}</p>}
        </div>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#D4AF37]/45 uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

function DepCard({ task, type }: { task: any; type: "depends" | "blocks" }) {
  const statusCol = STATUS_COLUMNS.find(s => s.key === task.status);
  return (
    <div className="flex items-center gap-2 bg-[#111] border border-[#D4AF37]/8 rounded-lg p-2.5">
      {type === "depends"
        ? <Link2 size={11} className="text-[#F59E0B]/50 flex-shrink-0" />
        : <GitBranch size={11} className="text-[#7B9EA8]/50 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-mono text-[#D4AF37]/40 mr-1">{task.code}</span>
        <span className="text-xs text-[#F5F5F5]/60 truncate">{task.title}</span>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: statusCol?.color }}>{statusCol?.label}</span>
    </div>
  );
}
