"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, ListTodo, Target, Wrench,
  Briefcase, DollarSign, Settings, FileText, Tag, Printer,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string; name: string; description?: string; vertical: string;
  status: string; phase?: string; priority: number; lead_agent_id?: string;
  notion_url?: string; trello_url?: string; drive_url?: string;
  start_date?: string; deadline?: string; progress: number;
  code?: string; tags?: string[]; created_at: string; updated_at: string;
}

interface Milestone {
  id: string; project_id: string; name: string; status: string;
  assignee_agent_id?: string;
  baseline_start?: string | null; baseline_end?: string | null;
  forecast_start?: string | null; forecast_end?: string | null;
  actual_start?: string | null;   actual_end?: string | null;
  depends_on?: string[]; order_index: number;
}

interface Task {
  id: string; code?: string; title: string; status: string;
  agent_id?: string; vertical?: string; updated_at: string;
  completed_at?: string; deliverable_url?: string;
}

interface Doc {
  id: string; title: string; category: string; file_type: string;
  drive_url?: string; drive_path?: string; notes?: string; created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VERTICAL_COLORS: Record<string, string> = {
  "STM Capital": "#D4AF37", "STM Digital": "#9B7EC8", "AgiSales": "#06B6D4",
  "Interno": "#8BA888", "STM Consultancy": "#4ADE80", "STM Health": "#F472B6",
};
const STATUS_COLORS: Record<string, string> = {
  active: "#4ADE80", paused: "#FBBF24", completed: "#71717A", cancelled: "#F87171",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Ativo", paused: "Pausado", completed: "Concluído", cancelled: "Cancelado",
};
const PRIORITY_LABEL = ["", "Alta", "Média", "Baixa"];
const PRIORITY_COLOR = ["", "#EF4444", "#F59E0B", "#71717A"];
const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};
const MILESTONE_STATUS: Record<string, { color: string; label: string }> = {
  done:        { color: "#4ADE80", label: "Concluído"    },
  in_progress: { color: "#D4AF37", label: "Em Andamento" },
  delayed:     { color: "#F87171", label: "Atrasado"     },
  pending:     { color: "#71717A", label: "Pendente"     },
};
const DOC_CATS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  estrategia:  { label: "Estratégia",  icon: <Target size={13} />,    color: "#D4AF37" },
  tecnico:     { label: "Técnico",     icon: <Wrench size={13} />,    color: "#06B6D4" },
  comercial:   { label: "Comercial",   icon: <Briefcase size={13} />, color: "#4ADE80" },
  financeiro:  { label: "Financeiro",  icon: <DollarSign size={13} />, color: "#F59E0B" },
  operacional: { label: "Operacional", icon: <Settings size={13} />,  color: "#9B7EC8" },
  geral:       { label: "Geral",       icon: <FileText size={13} />,  color: "#71717A" },
};
const FILE_ICONS: Record<string, string> = {
  doc: "📄", slide: "📊", sheet: "📈", pdf: "📋", link: "🔗", video: "🎥",
};

type Tab = "gantt" | "atividades" | "documentos";

// ─── Gantt helpers ────────────────────────────────────────────────────────────

function parseD(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}
function fmtBR(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit", timeZone: "UTC" });
}

// ─── GanttChart (inline SVG) ─────────────────────────────────────────────────

function GanttChart({ milestones }: { milestones: Milestone[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; m: Milestone } | null>(null);

  const sorted = [...milestones].sort((a, b) => a.order_index - b.order_index);

  if (!sorted.length) return (
    <div className="flex items-center justify-center h-40 border border-dashed border-[#D4AF37]/15 rounded-xl">
      <p className="text-[#F5F5F5]/30 text-sm">Nenhum milestone cadastrado</p>
    </div>
  );

  const allDates: Date[] = [];
  sorted.forEach(m => {
    [m.baseline_start, m.baseline_end, m.forecast_start, m.forecast_end, m.actual_start, m.actual_end]
      .forEach(s => { const d = parseD(s); if (d) allDates.push(d); });
  });

  const PAD = 8 * 86400000;
  const tMin = new Date(Math.min(...allDates.map(d => d.getTime())) - PAD);
  const tMax = new Date(Math.max(...allDates.map(d => d.getTime())) + PAD);
  const span = tMax.getTime() - tMin.getTime();

  const LW = 180, CW = 720, RH = 42, BH = 10, HH = 28;
  const TW = LW + CW;
  const TH = HH + sorted.length * RH + 8;

  const xOf = (d: Date) => LW + ((d.getTime() - tMin.getTime()) / span) * CW;
  const wOf = (s: Date, e: Date) => Math.max(((e.getTime() - s.getTime()) / span) * CW, 4);

  // Month ticks
  const ticks: { x: number; lbl: string }[] = [];
  const tc = new Date(Date.UTC(tMin.getUTCFullYear(), tMin.getUTCMonth(), 1));
  while (tc <= tMax) {
    const x = xOf(tc);
    if (x >= LW && x <= TW)
      ticks.push({ x, lbl: tc.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }) });
    tc.setUTCMonth(tc.getUTCMonth() + 1);
  }

  const todayX = xOf(new Date());
  const idToIdx = Object.fromEntries(sorted.map((m, i) => [m.id, i]));

  return (
    <div className="w-full overflow-x-auto">
      {/* Legend */}
      <div className="mb-3 flex items-center gap-5 text-[11px] text-[#F5F5F5]/40">
        <span className="flex items-center gap-1.5"><span className="w-8 h-1.5 rounded bg-[#4B5563]" /> Baseline</span>
        <span className="flex items-center gap-1.5"><span className="w-8 h-2.5 rounded bg-[#D4AF37]" /> Forecast</span>
        <span className="flex items-center gap-1.5"><span className="w-8 h-2.5 rounded border border-[#4ADE80] bg-[#4ADE8030]" /> Realizado</span>
      </div>

      <svg width={TW} height={TH} className="select-none" onMouseLeave={() => setTip(null)}>
        {/* BG */}
        <rect width={TW} height={TH} fill="#0D0D0D" rx={8} />
        <rect width={TW} height={HH} fill="#111" rx={8} />
        <rect y={HH - 6} width={TW} height={6} fill="#111" />

        {/* Month grid */}
        {ticks.map(t => (
          <g key={t.x}>
            <line x1={t.x} y1={HH} x2={t.x} y2={TH} stroke="#D4AF3712" strokeWidth={1} />
            <text x={t.x + 4} y={HH - 7} fontSize={10} fill="#D4AF3780">{t.lbl}</text>
          </g>
        ))}

        {/* Today */}
        {todayX >= LW && todayX <= TW && (
          <>
            <line x1={todayX} y1={HH} x2={todayX} y2={TH} stroke="#F87171" strokeWidth={1.5} strokeDasharray="4,3" />
            <text x={todayX + 3} y={HH + 11} fontSize={9} fill="#F87171">hoje</text>
          </>
        )}

        {/* Dependency arrows */}
        {sorted.map(m => {
          if (!m.depends_on?.length) return null;
          return m.depends_on.map(depId => {
            const srcIdx = idToIdx[depId];
            const dstIdx = idToIdx[m.id];
            if (srcIdx === undefined || dstIdx === undefined) return null;
            const srcM = sorted[srcIdx];
            const srcEnd = parseD(srcM.forecast_end ?? srcM.baseline_end);
            const dstStart = parseD(m.forecast_start ?? m.baseline_start);
            if (!srcEnd || !dstStart) return null;
            const x1 = xOf(srcEnd);
            const y1 = HH + srcIdx * RH + RH / 2;
            const x2 = xOf(dstStart);
            const y2 = HH + dstIdx * RH + RH / 2;
            return (
              <g key={`${m.id}-${depId}`}>
                <path d={`M${x1},${y1} C${x1+20},${y1} ${x2-20},${y2} ${x2},${y2}`}
                  fill="none" stroke="#D4AF3740" strokeWidth={1.5} strokeDasharray="3,2"
                  markerEnd="url(#arrow)" />
              </g>
            );
          });
        })}

        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#D4AF3770" />
          </marker>
        </defs>

        {/* Rows */}
        {sorted.map((m, i) => {
          const y = HH + i * RH;
          const sc = MILESTONE_STATUS[m.status]?.color ?? "#71717A";
          const bs = parseD(m.baseline_start), be = parseD(m.baseline_end);
          const fs = parseD(m.forecast_start), fe = parseD(m.forecast_end);
          const as_ = parseD(m.actual_start),  ae  = parseD(m.actual_end);
          const isDiamond = fs && fe && fs.getTime() === fe.getTime();

          return (
            <g key={m.id}>
              <rect x={0} y={y} width={TW} height={RH} fill={i % 2 === 0 ? "#FFFFFF04" : "transparent"} />

              {/* Status dot */}
              <circle cx={10} cy={y + RH / 2} r={4} fill={sc} />

              {/* Label */}
              <foreignObject x={18} y={y + 4} width={LW - 22} height={RH - 8}>
                <div style={{ fontSize: 11, color: '#F5F5F5CC', lineHeight: '1.2', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {m.name}
                </div>
                {m.assignee_agent_id && (
                  <div style={{ fontSize: 10, color: '#F5F5F530', marginTop: 1 }}>
                    {AGENT_EMOJI[m.assignee_agent_id] ?? ''} {m.assignee_agent_id}
                  </div>
                )}
              </foreignObject>

              {/* Divider */}
              <line x1={LW} y1={y} x2={LW} y2={y + RH} stroke="#D4AF3718" strokeWidth={1} />

              {/* Baseline */}
              {bs && be && (
                <rect x={xOf(bs)} y={y + RH / 2 - 2} width={wOf(bs, be)} height={4}
                  rx={2} fill="#4B5563" />
              )}

              {/* Forecast */}
              {fs && fe && !isDiamond && (
                <rect x={xOf(fs)} y={y + RH / 2 - BH / 2} width={wOf(fs, fe)} height={BH}
                  rx={3} fill={`${sc}CC`} stroke={sc} strokeWidth={1}
                  className="cursor-pointer"
                  onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, m })} />
              )}

              {/* Diamond milestone */}
              {isDiamond && fs && (
                <polygon
                  points={`${xOf(fs)},${y + RH / 2 - 7} ${xOf(fs) + 7},${y + RH / 2} ${xOf(fs)},${y + RH / 2 + 7} ${xOf(fs) - 7},${y + RH / 2}`}
                  fill={sc} className="cursor-pointer"
                  onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, m })} />
              )}

              {/* Actual */}
              {as_ && ae && (
                <rect x={xOf(as_)} y={y + RH / 2 - BH / 2 - 1} width={wOf(as_, ae)} height={BH + 2}
                  rx={3} fill="#4ADE8030" stroke="#4ADE80" strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, m })} />
              )}

              <line x1={0} y1={y + RH} x2={TW} y2={y + RH} stroke="#D4AF370C" strokeWidth={1} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div className="fixed z-50 bg-[#1A1A1A] border border-[#D4AF37]/25 rounded-xl p-3 shadow-xl text-xs pointer-events-none max-w-[250px]"
          style={{ left: tip.x + 12, top: tip.y - 10 }}>
          <p className="font-semibold text-[#F5F5F5] mb-2">{tip.m.name}</p>
          <p className="mb-1">
            <span className="text-[#D4AF37]/60">Status: </span>
            <span style={{ color: MILESTONE_STATUS[tip.m.status]?.color }}>
              {MILESTONE_STATUS[tip.m.status]?.label}
            </span>
          </p>
          {tip.m.assignee_agent_id && (
            <p className="text-[#F5F5F5]/40 mb-1">{AGENT_EMOJI[tip.m.assignee_agent_id] ?? ''} {tip.m.assignee_agent_id}</p>
          )}
          {tip.m.baseline_start && <p className="text-[#F5F5F5]/40">Baseline: {fmtBR(parseD(tip.m.baseline_start)!)} → {tip.m.baseline_end ? fmtBR(parseD(tip.m.baseline_end)!) : '?'}</p>}
          {tip.m.forecast_start && <p className="text-[#F5F5F5]/40">Forecast: {fmtBR(parseD(tip.m.forecast_start)!)} → {tip.m.forecast_end ? fmtBR(parseD(tip.m.forecast_end)!) : '?'}</p>}
          {tip.m.actual_start   && <p className="text-[#4ADE80]/80">Realizado: {fmtBR(parseD(tip.m.actual_start)!)} {tip.m.actual_end ? '→ ' + fmtBR(parseD(tip.m.actual_end)!) : '(em andamento)'}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const id = params?.id ?? "";

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("gantt");
  const [tablesOk, setTablesOk] = useState(true);
  const [doneOpen, setDoneOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: proj } = await supabase.from("projects").select("*").eq("id", id).single();
    if (!proj) { setLoading(false); return; }
    setProject(proj as Project);

    const taskQ = (proj as any).code
      ? supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("project_code", (proj as any).code).order("updated_at", { ascending: false }).limit(60)
      : supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("vertical", (proj as any).vertical).order("updated_at", { ascending: false }).limit(60);

    const [tRes, mRes, dRes] = await Promise.all([
      taskQ,
      supabase.from("project_milestones").select("*").eq("project_id", id).order("order_index"),
      supabase.from("project_documents").select("*").eq("project_id", id).order("created_at"),
    ]);

    setTasks((tRes.data ?? []) as Task[]);
    const bad = (e: any) => e?.code === "PGRST205";
    setTablesOk(!bad(mRes.error) && !bad(dRes.error));
    setMilestones((mRes.data ?? []) as Milestone[]);
    setDocs((dRes.data ?? []) as Doc[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── PDF export via window.print ──
  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 200);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#080808]">
      <Loader2 size={28} className="text-[#D4AF37]/40 animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#080808] gap-4">
      <p className="text-[#F5F5F5]/40">Projeto não encontrado</p>
      <button onClick={() => router.push("/projects")}
        className="text-[#D4AF37]/60 hover:text-[#D4AF37] text-sm flex items-center gap-1.5">
        <ArrowLeft size={14} /> Voltar
      </button>
    </div>
  );

  const vc = VERTICAL_COLORS[project.vertical] ?? "#D4AF37";
  const sc = STATUS_COLORS[project.status] ?? "#71717A";
  const tasksDone    = tasks.filter(t => t.status === "done");
  const tasksActive  = tasks.filter(t => ["in_progress","review"].includes(t.status));
  const tasksBlocked = tasks.filter(t => t.status === "blocked");
  const tasksBacklog = tasks.filter(t => t.status === "backlog");

  const docsByCat: Record<string, Doc[]> = {};
  for (const d of docs) { (docsByCat[d.category] ??= []).push(d); }

  return (
    <>
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #print-area { padding: 20px; }
          svg { max-width: 100%; }
        }
        .print-only { display: none; }
      `}</style>

      <div id="print-area" ref={printRef} className="min-h-screen bg-[#080808] text-[#F5F5F5]">
        {/* ── Header ── */}
        <div className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur border-b border-[#D4AF37]/10 no-print">
          <div className="px-6 py-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => router.push("/projects")}
                className="flex items-center gap-1.5 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 text-sm transition-colors">
                <ArrowLeft size={14} /> Voltar
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#D4AF37] text-xs rounded-xl transition-colors">
                <Printer size={13} />
                {printing ? "Preparando…" : "Exportar PDF"}
              </button>
            </div>

            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {project.code && <span className="text-xs font-mono text-[#D4AF37]/50">{project.code}</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded border font-medium"
                    style={{ color: vc, borderColor: `${vc}30`, backgroundColor: `${vc}10` }}>
                    {project.vertical}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded border"
                    style={{ color: sc, borderColor: `${sc}30`, backgroundColor: `${sc}10` }}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </span>
                  {project.phase && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[#F5F5F5]/10 text-[#F5F5F5]/40 capitalize">
                      {project.phase}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                {project.description && <p className="text-sm text-[#F5F5F5]/40 mt-1">{project.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {project.notion_url && <ExtLink href={project.notion_url} label="Notion" />}
                {project.trello_url && <ExtLink href={project.trello_url} label="Trello" />}
                {project.drive_url  && <ExtLink href={project.drive_url}  label="Drive"  />}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">Progresso</span>
                <span className="text-xs font-bold" style={{ color: vc }}>{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: vc }} />
              </div>
            </div>

            {/* Metrics */}
            <div className="flex gap-6 mt-4 flex-wrap text-xs">
              {project.lead_agent_id && <Metric label="Agente">{AGENT_EMOJI[project.lead_agent_id] ?? ''} {project.lead_agent_id}</Metric>}
              {project.priority      && <Metric label="Prioridade"><span style={{ color: PRIORITY_COLOR[project.priority] }}>{PRIORITY_LABEL[project.priority]}</span></Metric>}
              {project.start_date    && <Metric label="Início">{new Date(project.start_date).toLocaleDateString("pt-BR")}</Metric>}
              {project.deadline      && <Metric label="Deadline"><span className="text-[#F87171]">{new Date(project.deadline).toLocaleDateString("pt-BR")}</span></Metric>}
              <Metric label="Tarefas">{tasksActive.length} ativas · {tasksDone.length} feitas</Metric>
            </div>

            {project.tags?.length && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <Tag size={10} className="text-[#D4AF37]/30" />
                {project.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/8 border border-[#D4AF37]/15 text-[#D4AF37]/60 rounded-full">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex px-6 max-w-6xl mx-auto border-t border-[#D4AF37]/10">
            {(["gantt","atividades","documentos"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  tab === t ? "text-[#D4AF37] border-[#D4AF37]" : "text-[#F5F5F5]/40 border-transparent hover:text-[#F5F5F5]/70"
                }`}>
                {t === "gantt" ? "📅 Gantt" : t === "atividades" ? "✅ Atividades" : "📁 Documentos"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 py-6 max-w-6xl mx-auto">

          {/* Gantt */}
          {tab === "gantt" && (
            tablesOk
              ? <GanttChart milestones={milestones} />
              : <MigrationNotice />
          )}

          {/* Atividades */}
          {tab === "atividades" && (
            <div className="space-y-4">
              {!tasks.length && <EmptyMsg text="Nenhuma tarefa vinculada a este projeto" />}
              {tasksBlocked.length > 0 && <TaskGroup label="🚫 Bloqueado"    tasks={tasksBlocked} color="#F87171" defaultOpen />}
              {tasksActive.length  > 0 && <TaskGroup label="🔄 Em Andamento" tasks={tasksActive}  color="#D4AF37" defaultOpen />}
              {tasksBacklog.length > 0 && <TaskGroup label="📋 Backlog"       tasks={tasksBacklog} color="#71717A" defaultOpen={!tasksActive.length} />}
              {tasksDone.length    > 0 && (
                <TaskGroup label="✅ Concluídas" tasks={tasksDone} color="#4ADE80"
                  defaultOpen={doneOpen} onToggle={() => setDoneOpen(o => !o)} />
              )}
            </div>
          )}

          {/* Documentos */}
          {tab === "documentos" && (
            tablesOk ? (
              docs.length === 0 ? (
                <EmptyMsg text="Nenhum documento vinculado. Insira na tabela project_documents no Supabase." />
              ) : (
                <div className="space-y-6">
                  {Object.entries(docsByCat).map(([cat, list]) => {
                    const ci = DOC_CATS[cat] ?? DOC_CATS.geral;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <span style={{ color: ci.color }}>{ci.icon}</span>
                          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: ci.color }}>
                            {ci.label} ({list.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {list.map(doc => (
                            <div key={doc.id}
                              className="flex items-center gap-3 bg-[#111] border border-[#D4AF37]/8 hover:border-[#D4AF37]/20 rounded-xl px-4 py-3 transition-colors">
                              <span className="text-lg flex-shrink-0">{FILE_ICONS[doc.file_type] ?? "📄"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#F5F5F5]/85 font-medium truncate">{doc.title}</p>
                                {doc.notes && <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5 truncate">{doc.notes}</p>}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded border border-white/8 text-[#F5F5F5]/40 capitalize flex-shrink-0">
                                {doc.file_type}
                              </span>
                              {doc.drive_url && (
                                <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[#D4AF37]/50 hover:text-[#D4AF37] text-xs transition-colors flex-shrink-0">
                                  <ExternalLink size={12} /> Abrir
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : <MigrationNotice />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors no-print">
      <ExternalLink size={11} /> {label}
    </a>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-[#F5F5F5]/70">{children}</p>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="text-center py-16 text-[#F5F5F5]/30 text-sm">{text}</div>;
}

function MigrationNotice() {
  return (
    <div className="border border-dashed border-[#D4AF37]/20 rounded-xl p-8 text-center">
      <p className="text-[#D4AF37]/60 font-medium mb-2">Tabelas não encontradas</p>
      <p className="text-[#F5F5F5]/30 text-sm">Execute: <code className="text-[#D4AF37]/50">node scripts/migrate.js</code></p>
    </div>
  );
}

function TaskGroup({
  label, tasks, color, defaultOpen, onToggle,
}: { label: string; tasks: Task[]; color: string; defaultOpen?: boolean; onToggle?: () => void }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const isOpen = onToggle ? defaultOpen : open;
  const toggle = onToggle ?? (() => setOpen(o => !o));

  return (
    <div className="border border-[#D4AF37]/8 rounded-xl overflow-hidden">
      <button onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} className="text-[#F5F5F5]/30" /> : <ChevronRight size={14} className="text-[#F5F5F5]/30" />}
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
          <span className="text-[10px] text-[#F5F5F5]/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{tasks.length}</span>
        </div>
      </button>
      {isOpen && (
        <div className="divide-y divide-[#D4AF37]/5">
          {tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const icon: Record<string, React.ReactNode> = {
    done:        <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />,
    in_progress: <Loader2 size={13} className="text-[#D4AF37] animate-spin flex-shrink-0" />,
    review:      <Clock size={13} className="text-blue-400 flex-shrink-0" />,
    blocked:     <AlertCircle size={13} className="text-red-400 flex-shrink-0" />,
    backlog:     <ListTodo size={13} className="text-[#F5F5F5]/25 flex-shrink-0" />,
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] hover:bg-[#111] transition-colors">
      {icon[task.status] ?? <ListTodo size={13} className="text-[#F5F5F5]/20 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.code && <span className="text-[10px] font-mono text-[#D4AF37]/40">{task.code}</span>}
          <span className="text-sm text-[#F5F5F5]/80 truncate">{task.title}</span>
        </div>
        <p className="text-[10px] text-[#F5F5F5]/25 mt-0.5">
          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {task.agent_id && <span className="text-sm flex-shrink-0">{AGENT_EMOJI[task.agent_id] ?? ""}</span>}
      {task.deliverable_url && (
        <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer"
          className="text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors flex-shrink-0">
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
