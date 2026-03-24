"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X, ExternalLink, ChevronLeft, ChevronRight, RefreshCw,
  Search, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  code: string;
  title: string;
  description?: string;
  agent_id?: string;
  status: string;
  vertical?: string;
  project_code?: string;
  priority?: number;
  notes?: string;
  deliverable_url?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "backlog",     label: "Backlog",        color: "#71717A", border: "border-zinc-600",   bg: "bg-zinc-600/10"  },
  { key: "in_progress", label: "Em Progresso",   color: "#60A5FA", border: "border-blue-500",   bg: "bg-blue-500/10"  },
  { key: "review",      label: "Em Review",      color: "#FBBF24", border: "border-yellow-500", bg: "bg-yellow-500/10"},
  { key: "blocked",     label: "Bloqueado",      color: "#F87171", border: "border-red-500",    bg: "bg-red-500/10"   },
  { key: "done",        label: "Concluído",      color: "#4ADE80", border: "border-green-500",  bg: "bg-green-500/10" },
];

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};

const PRIORITY_LABEL: Record<number, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const PRIORITY_COLOR: Record<number, string> = { 1: "text-red-400", 2: "text-yellow-400", 3: "text-zinc-400" };

const PROJECT_COLORS: Record<string, string> = {
  "CAP-001": "#D4AF37", "CAP-002": "#B8962E", "CAP-003": "#C8A84B",
  "DIG-001": "#9B7EC8", "DIG-002": "#7C5CBF", "DIG-003": "#B09AD6",
  "AGI-001": "#06B6D4", "INT-001": "#8BA888",
};

const SVC = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzMTMxOCwiZXhwIjoyMDg4NDA3MzE4fQ.0L45hSJTcit5DsgKRBB021EX0GTMOh8Yq3rIfomxT58";
const SB_URL = "https://duogqvusxueetapcvsfp.supabase.co";

// ── Helpers ────────────────────────────────────────────────────────────────
function relTime(iso?: string) {
  if (!iso) return "–";
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR }); }
  catch { return iso; }
}

function colOf(key: string) { return COLUMNS.find(c => c.key === key); }
function nextCol(key: string) {
  const idx = COLUMNS.findIndex(c => c.key === key);
  return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;
}
function prevCol(key: string) {
  const idx = COLUMNS.findIndex(c => c.key === key);
  return idx > 0 ? COLUMNS[idx - 1] : null;
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmDispatchModal({
  task, onConfirm, onCancel, dispatching, done,
}: {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
  dispatching: boolean;
  done: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto mb-3 text-green-400" size={36} />
            <p className="text-green-400 font-semibold text-lg">Task iniciada!</p>
            <p className="text-zinc-400 mt-1 text-sm">
              {AGENT_EMOJI[task.agent_id || ""] || "🤖"} {task.agent_id} foi notificado e começará em instantes.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-white font-bold text-lg mb-2">Iniciar task?</h2>
            <p className="text-zinc-400 text-sm mb-1">
              Você está prestes a mover <span className="font-mono text-blue-400">{task.code}</span> para{" "}
              <span className="text-blue-400 font-semibold">Em Progresso</span> e notificar o agente responsável.
            </p>
            <p className="text-zinc-300 text-sm mb-5">
              Agente: {AGENT_EMOJI[task.agent_id || ""] || "🤖"} <strong>{task.agent_id || "–"}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                disabled={dispatching}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={dispatching}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {dispatching ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirmar e disparar agente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({
  task, colKey, onMove, onOpen, onReviewAction,
}: {
  task: Task;
  colKey: string;
  onMove: (task: Task, direction: "next" | "prev") => void;
  onOpen: (task: Task) => void;
  onReviewAction?: (task: Task, action: "approve" | "adjust" | "reject") => void;
}) {
  const col = colOf(colKey)!;
  const has_next = !!nextCol(colKey);
  const has_prev = !!prevCol(colKey);
  const projColor = PROJECT_COLORS[task.project_code || ""] || "#71717A";

  return (
    <div
      onClick={() => onOpen(task)}
      className={`group relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:border-opacity-80 transition-all hover:shadow-lg`}
      style={{ "--hover-border": col.color } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.borderColor = col.color + "80")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs text-zinc-500">{task.code}</span>
        {task.priority && (
          <span className={`text-xs ${PRIORITY_COLOR[task.priority]}`}>
            ●{" "}{PRIORITY_LABEL[task.priority]}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm text-white font-medium line-clamp-2 mb-2">{task.title}</p>

      {/* Agent + vertical */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.agent_id && (
          <span className="text-xs text-zinc-400">
            {AGENT_EMOJI[task.agent_id] || "🤖"} {task.agent_id}
          </span>
        )}
        {task.project_code && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ background: projColor + "22", color: projColor }}
          >
            {task.project_code}
          </span>
        )}
        {task.vertical && (
          <span className="text-xs text-zinc-500">{task.vertical}</span>
        )}
      </div>

      <p className="text-xs text-zinc-600 mt-2">{relTime(task.updated_at)}</p>

      {/* Botões de Review — aparecem sempre nos cards de review */}
      {colKey === "review" && onReviewAction ? (
        <div className="flex gap-1.5 mt-3" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onReviewAction(task, "approve")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/40 font-medium transition-colors"
            title="Aprovar e concluir"
          >
            ✅ Aprovar
          </button>
          <button
            onClick={() => onReviewAction(task, "adjust")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/40 font-medium transition-colors"
            title="Solicitar ajuste"
          >
            ↩ Ajustar
          </button>
          <button
            onClick={() => onReviewAction(task, "reject")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/40 font-medium transition-colors"
            title="Reprovar"
          >
            ❌ Reprovar
          </button>
        </div>
      ) : (
        /* Move buttons para outras colunas */
        <div
          className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {has_prev && (
            <button
              onClick={() => onMove(task, "prev")}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title={`← ${prevCol(colKey)?.label}`}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {has_next && (
            <button
              onClick={() => onMove(task, "next")}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title={`→ ${nextCol(colKey)?.label}`}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────
function TaskDrawer({
  task, onClose, onStartTask, onMoveToReview,
}: {
  task: Task;
  onClose: () => void;
  onStartTask: (task: Task) => void;
  onMoveToReview: (task: Task) => void;
}) {
  const [notes, setNotes] = useState(task.notes || "");
  const [saving, setSaving] = useState(false);
  const projColor = PROJECT_COLORS[task.project_code || ""] || "#71717A";

  async function saveNotes() {
    setSaving(true);
    // Salvar nota no campo description da task (agentes leem este campo)
    await fetch(`${SB_URL}/rest/v1/tasks?code=eq.${task.code}`, {
      method: "PATCH",
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
      body: JSON.stringify({ notes, description: notes }),
    });
    // Notificar o agente sobre a nota adicionada
    if (task.agent_id && notes.trim()) {
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: task.agent_id,
          task: `[Nota do Yuri na task ${task.code} — "${task.title}"]:\n\n${notes}`,
          taskCode: task.code,
        }),
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-zinc-950 border-l border-zinc-800 p-6 overflow-y-auto flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs text-zinc-500">{task.code}</span>
            <h2 className="text-white text-lg font-bold mt-0.5">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1"><X size={18} /></button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-sm">
          {task.agent_id && (
            <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">
              {AGENT_EMOJI[task.agent_id] || "🤖"} {task.agent_id}
            </span>
          )}
          {task.project_code && (
            <span className="px-2 py-1 rounded font-mono text-xs"
              style={{ background: projColor + "22", color: projColor }}>
              {task.project_code}
            </span>
          )}
          {task.vertical && (
            <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-400 text-xs">{task.vertical}</span>
          )}
          {task.priority && (
            <span className={`px-2 py-1 rounded text-xs ${PRIORITY_COLOR[task.priority]} bg-zinc-800`}>
              Prioridade {PRIORITY_LABEL[task.priority]}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-zinc-900 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Descrição</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Notas</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-zinc-500"
            placeholder="Adicione notas sobre esta task..."
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="mt-1 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            {saving ? "Salvando..." : "Salvar notas"}
          </button>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-zinc-600 space-y-1">
          {task.updated_at && <p>Atualizado: {relTime(task.updated_at)}</p>}
          {task.completed_at && <p>Concluído: {relTime(task.completed_at)}</p>}
        </div>

        {/* Deliverable */}
        {task.deliverable_url && (
          <a
            href={task.deliverable_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={14} />
            Ver entregável
          </a>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-auto pt-4 border-t border-zinc-800">
          {task.status === "backlog" && (
            <button
              onClick={() => onStartTask(task)}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              ▶ Iniciar task
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              onClick={() => onMoveToReview(task)}
              className="flex-1 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm transition-colors"
            >
              🔍 Mover para Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(true);

  // Modal/Drawer state
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchDone, setDispatchDone] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reviewConfirmTask, setReviewConfirmTask] = useState<Task | null>(null);
  const [reviewActionTask, setReviewActionTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<"adjust" | "reject" | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Auto-refresh
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
    intervalRef.current = setInterval(loadTasks, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadTasks]);

  // Derived data
  const agents = Array.from(new Set(tasks.map(t => t.agent_id).filter(Boolean))) as string[];
  const verticals = Array.from(new Set(tasks.map(t => t.vertical).filter(Boolean))) as string[];

  const filtered = tasks.filter(t => {
    if (filterAgent && t.agent_id !== filterAgent) return false;
    if (filterVertical && t.vertical !== filterVertical) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !(t.code || "").toLowerCase().includes(q) &&
        !(t.agent_id || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const byCol = (key: string) => filtered.filter(t => t.status === key);

  const inProgress = filtered.filter(t => t.status === "in_progress").length;
  const done = filtered.filter(t => t.status === "done").length;

  // Move task locally + patch Supabase
  async function patchStatus(task: Task, newStatus: string) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));
    await fetch(`${SB_URL}/rest/v1/tasks?code=eq.${task.code}`, {
      method: "PATCH",
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() }),
    });
  }

  function handleMove(task: Task, direction: "next" | "prev") {
    const target = direction === "next" ? nextCol(task.status) : prevCol(task.status);
    if (!target) return;

    // backlog → in_progress: confirmar e disparar agente
    if (task.status === "backlog" && target.key === "in_progress") {
      setDispatchDone(false);
      setConfirmTask(task);
      return;
    }

    // in_progress → review: bloquear via botão — só agente pode mover
    // (Yuri pode usar o drawer se precisar forçar)
    if (task.status === "in_progress" && target.key === "review") {
      setReviewConfirmTask(task);
      return;
    }

    patchStatus(task, target.key);
  }

  async function handleConfirmDispatch() {
    if (!confirmTask) return;
    setDispatching(true);
    try {
      await patchStatus(confirmTask, "in_progress");
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: confirmTask.agent_id,
          task: confirmTask.title,
          taskCode: confirmTask.code,
        }),
      });
      setDispatchDone(true);
      setTimeout(() => setConfirmTask(null), 2500);
    } finally {
      setDispatching(false);
    }
  }

  function handleReviewAction(task: Task, action: "approve" | "adjust" | "reject") {
    if (action === "approve") {
      patchStatus(task, "done");
    } else {
      setReviewActionTask(task);
      setReviewAction(action);
      setReviewFeedback("");
    }
  }

  async function confirmReviewAction() {
    if (!reviewActionTask || !reviewAction) return;
    const targetStatus = reviewAction === "adjust" ? "in_progress" : "backlog";
    const actionLabel = reviewAction === "adjust" ? "Ajuste solicitado" : "Reprovado";
    await patchStatus(reviewActionTask, targetStatus);
    // Notificar agente com o feedback
    if (reviewFeedback.trim()) {
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: reviewActionTask.agent_id,
          task: `[${actionLabel} por Yuri — ${reviewActionTask.code}]\n\nTask: "${reviewActionTask.title}"\n\nFeedback: ${reviewFeedback}`,
          taskCode: reviewActionTask.code,
        }),
      });
    }
    setReviewActionTask(null);
    setReviewAction(null);
    setReviewFeedback("");
  }

  const visibleCols = showDone ? COLUMNS : COLUMNS.filter(c => c.key !== "done");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Modals */}
      {/* Modal: mover in_progress → review (só com confirmação) */}
      {reviewConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-yellow-500/40 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-yellow-400 mb-2">⚠️ Mover para Em Review</h2>
            <p className="text-sm text-zinc-300 mb-1">
              Tarefa: <span className="font-semibold text-white">{reviewConfirmTask.title}</span>
            </p>
            <p className="text-sm text-zinc-400 mb-4">
              "Em Review" indica que o agente <strong className="text-white">{reviewConfirmTask.agent_id}</strong> concluiu o trabalho e você precisa aprovar.
              <br /><br />
              Se a atividade <strong>ainda não foi concluída</strong> pelo agente, mantenha em "Em Progresso".
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReviewConfirmTask(null)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
                Cancelar — ainda está em andamento
              </button>
              <button onClick={async () => {
                await patchStatus(reviewConfirmTask, "review");
                setReviewConfirmTask(null);
              }} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-semibold transition-colors">
                Confirmar — trabalho concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ajuste ou reprovação de review */}
      {reviewActionTask && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`bg-zinc-900 border rounded-xl p-6 w-full max-w-md shadow-2xl ${reviewAction === "reject" ? "border-red-500/40" : "border-amber-500/40"}`}>
            <h2 className={`text-base font-bold mb-1 ${reviewAction === "reject" ? "text-red-400" : "text-amber-400"}`}>
              {reviewAction === "adjust" ? "↩ Solicitar Ajuste" : "❌ Reprovar Task"}
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Task: <span className="text-white font-medium">{reviewActionTask.title}</span>
              <br />
              <span className="text-xs text-zinc-500">
                {reviewAction === "adjust"
                  ? "A task voltará para Em Progresso e o agente será notificado com seu feedback."
                  : "A task voltará para Backlog. O agente receberá a justificativa."}
              </span>
            </p>
            <textarea
              value={reviewFeedback}
              onChange={e => setReviewFeedback(e.target.value)}
              rows={4}
              placeholder={reviewAction === "adjust" ? "Descreva o que precisa ser ajustado..." : "Justifique a reprovação..."}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setReviewActionTask(null); setReviewAction(null); }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={confirmReviewAction}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${reviewAction === "reject" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-amber-500 hover:bg-amber-400 text-black"}`}>
                {reviewAction === "adjust" ? "↩ Solicitar Ajuste" : "❌ Confirmar Reprovação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTask && (
        <ConfirmDispatchModal
          task={confirmTask}
          onConfirm={handleConfirmDispatch}
          onCancel={() => setConfirmTask(null)}
          dispatching={dispatching}
          done={dispatchDone}
        />
      )}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStartTask={t => { setSelectedTask(null); setDispatchDone(false); setConfirmTask(t); }}
          onMoveToReview={t => { patchStatus(t, "review"); setSelectedTask(null); }}
        />
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-bold">Fila de Tarefas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {filtered.length} tarefas · {inProgress} em andamento · {done} concluídas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTasks}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowDone(s => !s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showDone
                  ? "border-green-600 text-green-400 bg-green-600/10"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
              }`}
            >
              {showDone ? "✓ Ocultar concluídas" : "Mostrar concluídas"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-48"
            />
          </div>
          <select
            value={filterAgent}
            onChange={e => setFilterAgent(e.target.value)}
            className="text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none"
          >
            <option value="">Todos os agentes</option>
            {agents.map(a => (
              <option key={a} value={a}>{AGENT_EMOJI[a] || "🤖"} {a}</option>
            ))}
          </select>
          <select
            value={filterVertical}
            onChange={e => setFilterVertical(e.target.value)}
            className="text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none"
          >
            <option value="">Todas as verticais</option>
            {verticals.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-x-auto gap-4 p-6 pb-8">
          {visibleCols.map(col => {
            const cards = byCol(col.key);
            return (
              <div key={col.key} className="flex flex-col min-w-[280px] max-w-[320px] w-80 shrink-0">
                {/* Column header */}
                <div className={`rounded-t-lg px-3 py-2 mb-2 ${col.bg} border-t-2`}
                  style={{ borderColor: col.color }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: col.color }}>
                      {col.label}
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[calc(100vh-220px)]"
                  style={{ scrollbarWidth: "thin" }}>
                  {cards.length === 0 ? (
                    <div className="text-center py-8 text-zinc-700 text-sm">Vazio</div>
                  ) : (
                    cards.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        colKey={col.key}
                        onMove={handleMove}
                        onOpen={setSelectedTask}
                        onReviewAction={handleReviewAction}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
