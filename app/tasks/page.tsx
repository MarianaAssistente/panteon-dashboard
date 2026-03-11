export const dynamic = "force-dynamic";

import { supabase, Task } from "@/lib/supabase";
import TaskDrawer from "@/components/TaskDrawer";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLUMNS = [
  { key: "in_progress", label: "Em Progresso",  color: "border-blue-500/40 text-blue-400",   dot: "bg-blue-400"   },
  { key: "review",      label: "Em Review",      color: "border-yellow-500/40 text-yellow-400", dot: "bg-yellow-400" },
  { key: "blocked",     label: "Bloqueado",      color: "border-red-500/40 text-red-400",    dot: "bg-red-400"    },
  { key: "backlog",     label: "Backlog",         color: "border-white/15 text-white/40",     dot: "bg-white/30"   },
  { key: "done",        label: "Concluído",       color: "border-green-500/40 text-green-400", dot: "bg-green-400" },
];

const PRIORITY_ICON: Record<number, string> = { 1: "🔴", 2: "🟡", 3: "⚪️" };

const VERTICAL_COLORS: Record<string, string> = {
  "STM Capital":     "text-[#D4AF37]/60",
  "STM Digital":     "text-purple-400/60",
  "AgiSales":        "text-blue-400/60",
  "Interno":         "text-zinc-400/60",
  "STM Consultancy": "text-green-400/60",
  "STM Health":      "text-pink-400/60",
};

async function getTasks(filters: { agent?: string; vertical?: string; status?: string }) {
  let query = supabase
    .from("tasks")
    .select("*, agents(id, name, role, model)")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });

  if (filters.agent)    query = query.eq("agent_id", filters.agent);
  if (filters.vertical) query = query.eq("vertical", filters.vertical);
  if (filters.status)   query = query.eq("status", filters.status);

  const { data } = await query;
  return (data ?? []) as Task[];
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { agent?: string; vertical?: string; status?: string };
}) {
  const tasks = await getTasks(searchParams);

  // Group and sort: in_progress first, then by updated_at desc
  const grouped: Record<string, Task[]> = {};
  for (const col of STATUS_COLUMNS) grouped[col.key] = [];
  for (const task of tasks) {
    if (grouped[task.status]) grouped[task.status].push(task);
  }

  const totalActive = (grouped["in_progress"]?.length ?? 0) + (grouped["review"]?.length ?? 0);

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37]">Fila de Tarefas</h1>
          <p className="text-[#F5F5F5]/30 text-xs mt-0.5">{tasks.length} tarefas · {totalActive} em execução</p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const items = grouped[col.key] ?? [];
          return (
            <div key={col.key} className="flex flex-col">
              {/* Column header */}
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${col.color}`}>
                <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                <span className="ml-auto text-xs opacity-50">{items.length}</span>
              </div>

              {/* Tasks — max 5 visible, scroll if more */}
              <div className="flex flex-col gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: items.length > 5 ? "520px" : "auto" }}>
                {items.length === 0 ? (
                  <p className="text-[#F5F5F5]/15 text-xs text-center py-6">—</p>
                ) : (
                  items.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl p-3 hover:border-[#D4AF37]/30 hover:bg-[#181818] transition-all duration-200 cursor-pointer group"
                    >
                      {/* Code + Priority */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {(task as any).code && (
                          <span className="text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37]/60 border border-[#D4AF37]/15 px-1.5 py-0.5 rounded">
                            {(task as any).code}
                          </span>
                        )}
                        <span className="text-[10px]" title={`Prioridade ${PRIORITY_ICON[task.priority]}`}>
                          {PRIORITY_ICON[task.priority] ?? "🟡"}
                        </span>
                        {task.approval_status === "pending" && (
                          <span className="ml-auto text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                            Aprovação
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <p className="text-[#F5F5F5]/85 text-xs font-medium leading-snug group-hover:text-[#F5F5F5] transition-colors line-clamp-2 mb-2">
                        {task.title}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {task.agents && (
                          <span className="text-[#D4AF37]/50 text-[10px]">@{task.agents.name}</span>
                        )}
                        {task.vertical && (
                          <span className={`text-[10px] ${VERTICAL_COLORS[task.vertical] ?? "text-white/30"}`}>
                            {task.vertical}
                          </span>
                        )}
                      </div>

                      {/* Time + deliverable */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[#F5F5F5]/20 text-[10px]">
                          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {task.deliverable_url && (
                          <a
                            href={task.deliverable_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.deliverable_type === "video" ? "🎬" :
                             task.deliverable_type === "image" ? "🖼" :
                             task.deliverable_type === "document" ? "📄" : "🔗"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* "Show more" indicator */}
              {items.length > 5 && (
                <p className="text-[#F5F5F5]/20 text-[10px] text-center mt-2">
                  ↕ role para ver todos ({items.length})
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
