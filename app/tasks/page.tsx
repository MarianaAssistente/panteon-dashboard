import { supabase, Task } from "@/lib/supabase";
import TaskDrawer from "@/components/TaskDrawer";
import StatusBadge from "@/components/StatusBadge";
import FilterBar from "@/components/FilterBar";
import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLUMNS = [
  { key: "in_progress",  label: "Em Progresso",  color: "border-blue-500/30 text-blue-400"   },
  { key: "review",       label: "Em Review",      color: "border-yellow-500/30 text-yellow-400" },
  { key: "blocked",      label: "Bloqueado",      color: "border-red-500/30 text-red-400"     },
  { key: "backlog",      label: "Backlog",         color: "border-white/10 text-white/40"      },
  { key: "done",         label: "Concluído",       color: "border-green-500/30 text-green-400" },
];

const PRIORITY_LABEL: Record<number, string> = { 1: "🔴", 2: "🟡", 3: "🟢" };
const VERTICAL_COLORS: Record<string, string> = {
  "STM Capital": "text-blue-400", "STM Digital": "text-purple-400",
  "STM Consultancy": "text-orange-400", "STM Health": "text-green-400",
  "AgiSales": "text-cyan-400", "Interno": "text-[#D4AF37]",
};

async function getTasks(filters: { agent?: string; vertical?: string; status?: string }) {
  let query = supabase
    .from("tasks")
    .select("*, agents(id, name, role, model)")
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false });

  if (filters.agent) query = query.eq("agent_id", filters.agent);
  if (filters.vertical) query = query.eq("vertical", filters.vertical);
  if (filters.status) query = query.eq("status", filters.status);

  const { data } = await query;
  return (data ?? []) as Task[];
}

export const revalidate = 30;

interface PageProps {
  searchParams: { agent?: string; vertical?: string; status?: string };
}

export default async function TasksPage({ searchParams }: PageProps) {
  const tasks = await getTasks(searchParams);

  const grouped: Record<string, Task[]> = {};
  for (const col of STATUS_COLUMNS) grouped[col.key] = [];
  for (const task of tasks) {
    if (grouped[task.status]) grouped[task.status].push(task);
    else grouped[task.status] = [task];
  }

  const hasFilters = !!(searchParams.agent || searchParams.vertical || searchParams.status);
  const filteredCols = hasFilters
    ? STATUS_COLUMNS // show all when filtered — filtered tasks are mixed
    : STATUS_COLUMNS;

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Fila de Tarefas</h1>
        <p className="text-[#F5F5F5]/40 text-sm mt-1">{tasks.length} tarefas</p>
      </div>

      {/* Filters */}
      <Suspense>
        <FilterBar />
      </Suspense>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCols.map((col) => {
          const items = grouped[col.key] ?? [];
          return (
            <div key={col.key}>
              {/* Column header */}
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${col.color}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${col.color.split(" ")[1]}`}>
                  {col.label}
                </p>
                <span className="text-xs opacity-60">{items.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {items.map((task) => (
                  <TaskDrawer
                    key={task.id}
                    task={task}
                    trigger={
                      <div className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl p-4 hover:border-[#D4AF37]/30 hover:bg-[#181818] transition-all cursor-pointer">
                        {/* Priority + title */}
                        <div className="flex items-start gap-2 mb-2">
                          <span title={`Prioridade ${PRIORITY_LABEL[task.priority]}`} className="shrink-0 text-xs mt-0.5">
                            {PRIORITY_LABEL[task.priority] ?? "🟡"}
                          </span>
                          <p className="text-[#F5F5F5]/85 text-sm font-medium leading-snug">
                            {task.title}
                          </p>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 flex-wrap text-xs mt-2">
                          {task.agents && (
                            <span className="text-[#D4AF37]/50">@{task.agents.name}</span>
                          )}
                          {task.vertical && (
                            <span className={VERTICAL_COLORS[task.vertical] ?? "text-white/30"}>
                              {task.vertical}
                            </span>
                          )}
                          <span className="text-[#F5F5F5]/20 ml-auto">
                            {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        {/* Approval badge */}
                        {task.approval_status === "pending" && (
                          <div className="mt-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded px-2 py-0.5 inline-block">
                            ⏳ Aguardando aprovação
                          </div>
                        )}

                        {/* Deliverable indicator */}
                        {task.deliverable_url && (
                          <div className="mt-2 text-xs text-[#D4AF37]/40 flex items-center gap-1">
                            {task.deliverable_type === "video" ? "🎬" :
                             task.deliverable_type === "image" ? "🖼" :
                             task.deliverable_type === "document" ? "📄" : "🔗"} Entregável disponível
                          </div>
                        )}
                      </div>
                    }
                  />
                ))}
                {items.length === 0 && (
                  <div className="text-center py-6 text-[#F5F5F5]/15 text-xs border border-dashed border-white/5 rounded-xl">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
