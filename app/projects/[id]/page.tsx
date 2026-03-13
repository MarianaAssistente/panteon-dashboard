"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, ListTodo, Target, Wrench,
  Briefcase, DollarSign, Settings, FileText, Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import GanttChart, { type Milestone } from "@/components/GanttChart";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description?: string;
  vertical: string;
  status: string;
  phase?: string;
  priority: number;
  lead_agent_id?: string;
  notion_url?: string;
  trello_url?: string;
  drive_url?: string;
  start_date?: string;
  deadline?: string;
  progress: number;
  code?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  code?: string;
  title: string;
  status: string;
  agent_id?: string;
  vertical?: string;
  updated_at: string;
  completed_at?: string;
  deliverable_url?: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  file_type: string;
  drive_url?: string;
  drive_path?: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VERTICAL_COLORS: Record<string, string> = {
  "STM Capital":     "#D4AF37",
  "STM Digital":     "#9B7EC8",
  "AgiSales":        "#06B6D4",
  "Interno":         "#8BA888",
  "STM Consultancy": "#4ADE80",
  "STM Health":      "#F472B6",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "#4ADE80",
  paused:    "#FBBF24",
  completed: "#71717A",
  cancelled: "#F87171",
};

const STATUS_LABELS: Record<string, string> = {
  active:    "Ativo",
  paused:    "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const PRIORITY_LABEL = ["", "Alta", "Média", "Baixa"];
const PRIORITY_COLOR = ["", "#EF4444", "#F59E0B", "#71717A"];

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};

const DOC_CATEGORIES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  estrategia:   { label: "Estratégia",    icon: <Target size={13} />,   color: "#D4AF37" },
  tecnico:      { label: "Técnico",       icon: <Wrench size={13} />,   color: "#06B6D4" },
  comercial:    { label: "Comercial",     icon: <Briefcase size={13} />, color: "#4ADE80" },
  financeiro:   { label: "Financeiro",    icon: <DollarSign size={13} />, color: "#F59E0B" },
  operacional:  { label: "Operacional",   icon: <Settings size={13} />, color: "#9B7EC8" },
  geral:        { label: "Geral",         icon: <FileText size={13} />, color: "#71717A" },
};

const FILE_TYPE_ICONS: Record<string, string> = {
  doc:   "📄",
  slide: "📊",
  sheet: "📈",
  pdf:   "📋",
  link:  "🔗",
  video: "🎥",
};

type Tab = "gantt" | "atividades" | "documentos";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("gantt");
  const [tablesExist, setTablesExist] = useState(true);

  const [doneOpen, setDoneOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    // Fetch project
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (!proj) { setLoading(false); return; }
    setProject(proj as Project);

    // Fetch tasks by project_code or id
    const taskQuery = proj.code
      ? supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("project_code", proj.code).order("updated_at", { ascending: false }).limit(50)
      : supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("vertical", proj.vertical).order("updated_at", { ascending: false }).limit(50);

    const [taskRes, milestoneRes, docRes] = await Promise.all([
      taskQuery,
      // Try milestones — may not exist
      supabase.from("project_milestones").select("*").eq("project_id", id).order("order_index"),
      // Try documents — may not exist
      supabase.from("project_documents").select("*").eq("project_id", id).order("created_at"),
    ]);

    setTasks((taskRes.data ?? []) as Task[]);

    // Check if tables exist (PGRST205 = table not found)
    const tablesOk = !((milestoneRes.error as any)?.code === "PGRST205" ||
                       (docRes.error as any)?.code === "PGRST205");
    setTablesExist(tablesOk);
    setMilestones((milestoneRes.data ?? []) as Milestone[]);
    setDocuments((docRes.data ?? []) as Document[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080808]">
        <Loader2 size={28} className="text-[#D4AF37]/40 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#080808] gap-4">
        <p className="text-[#F5F5F5]/40">Projeto não encontrado</p>
        <button onClick={() => router.push("/projects")}
          className="text-[#D4AF37]/60 hover:text-[#D4AF37] text-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Voltar para Projetos
        </button>
      </div>
    );
  }

  const vertColor = VERTICAL_COLORS[project.vertical] ?? "#D4AF37";
  const statusColor = STATUS_COLORS[project.status] ?? "#71717A";

  const tasksDone       = tasks.filter(t => t.status === "done");
  const tasksActive     = tasks.filter(t => ["in_progress","review"].includes(t.status));
  const tasksBlocked    = tasks.filter(t => t.status === "blocked");
  const tasksBacklog    = tasks.filter(t => t.status === "backlog");

  // Group documents by category
  const docsByCategory: Record<string, Document[]> = {};
  for (const doc of documents) {
    if (!docsByCategory[doc.category]) docsByCategory[doc.category] = [];
    docsByCategory[doc.category].push(doc);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur border-b border-[#D4AF37]/10">
        <div className="px-6 py-4 max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para Projetos
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {project.code && (
                  <span className="text-xs font-mono text-[#D4AF37]/50">{project.code}</span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded border font-medium"
                  style={{ color: vertColor, borderColor: `${vertColor}30`, backgroundColor: `${vertColor}10` }}>
                  {project.vertical}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded border"
                  style={{ color: statusColor, borderColor: `${statusColor}30`, backgroundColor: `${statusColor}10` }}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                {project.phase && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#F5F5F5]/10 text-[#F5F5F5]/40 capitalize">
                    {project.phase}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-[#F5F5F5]">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[#F5F5F5]/40 mt-1">{project.description}</p>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center gap-2">
              {project.notion_url && (
                <a href={project.notion_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors">
                  <ExternalLink size={11} /> Notion
                </a>
              )}
              {project.trello_url && (
                <a href={project.trello_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors">
                  <ExternalLink size={11} /> Trello
                </a>
              )}
              {project.drive_url && (
                <a href={project.drive_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors">
                  <ExternalLink size={11} /> Drive
                </a>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">Progresso</span>
              <span className="text-xs font-bold" style={{ color: vertColor }}>{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${project.progress}%`, backgroundColor: vertColor }} />
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex gap-6 mt-4 flex-wrap text-xs">
            {project.lead_agent_id && (
              <MetricItem label="Agente">
                {AGENT_EMOJI[project.lead_agent_id] ?? "—"} {project.lead_agent_id}
              </MetricItem>
            )}
            {project.priority && (
              <MetricItem label="Prioridade">
                <span style={{ color: PRIORITY_COLOR[project.priority] }}>
                  {PRIORITY_LABEL[project.priority]}
                </span>
              </MetricItem>
            )}
            {project.start_date && (
              <MetricItem label="Início">
                {new Date(project.start_date).toLocaleDateString("pt-BR")}
              </MetricItem>
            )}
            {project.deadline && (
              <MetricItem label="Deadline">
                <span className="text-[#F87171]">
                  {new Date(project.deadline).toLocaleDateString("pt-BR")}
                </span>
              </MetricItem>
            )}
            <MetricItem label="Tarefas">
              {tasksActive.length} ativas · {tasksDone.length} feitas
            </MetricItem>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <Tag size={10} className="text-[#D4AF37]/30" />
              {project.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/8 border border-[#D4AF37]/15 text-[#D4AF37]/60 rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-6 max-w-6xl mx-auto border-t border-[#D4AF37]/10">
          {(["gantt","atividades","documentos"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-[#D4AF37] border-[#D4AF37]"
                  : "text-[#F5F5F5]/40 border-transparent hover:text-[#F5F5F5]/70"
              }`}
            >
              {tab === "gantt" ? "📅 Gantt" : tab === "atividades" ? "✅ Atividades" : "📁 Documentos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* ── Gantt ── */}
        {activeTab === "gantt" && (
          <div>
            {!tablesExist ? (
              <MigrationNotice />
            ) : (
              <GanttChart milestones={milestones} />
            )}
          </div>
        )}

        {/* ── Atividades ── */}
        {activeTab === "atividades" && (
          <div className="space-y-4">
            {tasks.length === 0 && (
              <div className="text-center py-16 text-[#F5F5F5]/30 text-sm">
                Nenhuma tarefa vinculada a este projeto
              </div>
            )}

            {/* Blocked */}
            {tasksBlocked.length > 0 && (
              <TaskGroup
                label="🚫 Bloqueado"
                tasks={tasksBlocked}
                defaultOpen
                color="#F87171"
              />
            )}

            {/* Active */}
            {tasksActive.length > 0 && (
              <TaskGroup
                label="🔄 Em Andamento"
                tasks={tasksActive}
                defaultOpen
                color="#D4AF37"
              />
            )}

            {/* Backlog */}
            {tasksBacklog.length > 0 && (
              <TaskGroup
                label="📋 Backlog"
                tasks={tasksBacklog}
                defaultOpen={tasksActive.length === 0}
                color="#71717A"
              />
            )}

            {/* Done */}
            {tasksDone.length > 0 && (
              <TaskGroup
                label="✅ Concluídas"
                tasks={tasksDone}
                defaultOpen={doneOpen}
                onToggle={() => setDoneOpen(!doneOpen)}
                color="#4ADE80"
              />
            )}
          </div>
        )}

        {/* ── Documentos ── */}
        {activeTab === "documentos" && (
          <div>
            {!tablesExist ? (
              <MigrationNotice />
            ) : documents.length === 0 ? (
              <div className="text-center py-16 text-[#F5F5F5]/30 text-sm">
                Nenhum documento vinculado a este projeto.<br />
                <span className="text-[10px] mt-1 block text-[#F5F5F5]/20">
                  Insira documentos na tabela <code>project_documents</code> no Supabase.
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(docsByCategory).map(([cat, docs]) => {
                  const catInfo = DOC_CATEGORIES[cat] ?? DOC_CATEGORIES.geral;
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3">
                        <span style={{ color: catInfo.color }}>{catInfo.icon}</span>
                        <h3 className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: catInfo.color }}>
                          {catInfo.label} ({docs.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {docs.map(doc => (
                          <div key={doc.id}
                            className="flex items-center gap-3 bg-[#111] border border-[#D4AF37]/8 hover:border-[#D4AF37]/20 rounded-xl px-4 py-3 transition-colors">
                            <span className="text-lg flex-shrink-0">
                              {FILE_TYPE_ICONS[doc.file_type] ?? "📄"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#F5F5F5]/85 font-medium truncate">{doc.title}</p>
                              {doc.drive_path && (
                                <p className="text-[10px] text-[#F5F5F5]/25 mt-0.5 truncate">{doc.drive_path}</p>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded border border-white/10 text-[#F5F5F5]/40 capitalize flex-shrink-0">
                              {doc.file_type}
                            </span>
                            {doc.drive_url && (
                              <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors flex-shrink-0 text-xs">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-[#F5F5F5]/70">{children}</p>
    </div>
  );
}

function TaskGroup({
  label, tasks, defaultOpen, onToggle, color,
}: {
  label: string; tasks: Task[]; defaultOpen?: boolean;
  onToggle?: () => void; color: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const toggle = () => { onToggle ? onToggle() : setOpen(o => !o); };
  const isOpen = onToggle !== undefined ? defaultOpen : open;

  return (
    <div className="border border-[#D4AF37]/8 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} className="text-[#F5F5F5]/30" />
                  : <ChevronRight size={14} className="text-[#F5F5F5]/30" />}
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
          <span className="text-[10px] text-[#F5F5F5]/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
            {tasks.length}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-[#D4AF37]/5">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const statusIcon: Record<string, React.ReactNode> = {
    done:        <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />,
    in_progress: <Loader2 size={13} className="text-[#D4AF37] animate-spin flex-shrink-0" />,
    review:      <Clock size={13} className="text-blue-400 flex-shrink-0" />,
    blocked:     <AlertCircle size={13} className="text-red-400 flex-shrink-0" />,
    backlog:     <ListTodo size={13} className="text-[#F5F5F5]/30 flex-shrink-0" />,
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] hover:bg-[#111] transition-colors">
      {statusIcon[task.status] ?? <ListTodo size={13} className="text-[#F5F5F5]/20 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.code && <span className="text-[10px] font-mono text-[#D4AF37]/40">{task.code}</span>}
          <span className="text-sm text-[#F5F5F5]/80 truncate">{task.title}</span>
        </div>
        <p className="text-[10px] text-[#F5F5F5]/25 mt-0.5">
          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {task.agent_id && (
        <span className="text-sm flex-shrink-0">{AGENT_EMOJI[task.agent_id] ?? ""}</span>
      )}
      {task.deliverable_url && (
        <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors flex-shrink-0">
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

function MigrationNotice() {
  return (
    <div className="border border-dashed border-[#D4AF37]/20 rounded-xl p-8 text-center">
      <p className="text-[#D4AF37]/60 font-medium mb-2">Tabelas não encontradas no Supabase</p>
      <p className="text-[#F5F5F5]/30 text-sm mb-4">
        Execute a migration SQL para criar as tabelas <code className="text-[#D4AF37]/50">project_milestones</code> e{" "}
        <code className="text-[#D4AF37]/50">project_documents</code>.
      </p>
      <p className="text-[10px] text-[#F5F5F5]/20">
        Arquivo: <code>migrations/001_project_detail_tables.sql</code><br />
        Execute em: <a href="https://supabase.com/dashboard/project/duogqvusxueetapcvsfp/sql"
          target="_blank" rel="noopener noreferrer"
          className="text-[#D4AF37]/40 hover:text-[#D4AF37]">
          Supabase SQL Editor →
        </a>
      </p>
    </div>
  );
}
