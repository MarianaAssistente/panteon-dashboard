"use client";

import { useEffect, useState } from "react";
import { supabase, Task } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLUMNS = [
  { key: "in_progress", label: "Em Progresso",  dot: "bg-blue-400",    border: "border-blue-500/40 text-blue-400"    },
  { key: "review",      label: "Em Review",      dot: "bg-yellow-400",  border: "border-yellow-500/40 text-yellow-400" },
  { key: "blocked",     label: "Bloqueado",      dot: "bg-red-400",     border: "border-red-500/40 text-red-400"      },
  { key: "backlog",     label: "Backlog",         dot: "bg-white/30",    border: "border-white/15 text-white/40"       },
  { key: "done",        label: "Concluído",       dot: "bg-green-400",   border: "border-green-500/40 text-green-400"  },
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterVertical, setFilterVertical] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase
        .from("tasks")
        .select("*, agents(id, name, role)")
        .order("updated_at", { ascending: false });
      if (filterAgent)    q = q.eq("agent_id", filterAgent);
      if (filterVertical) q = q.eq("vertical", filterVertical);
      const { data } = await q;
      setTasks(data ?? []);
      setLoading(false);
    }
    load();
  }, [filterAgent, filterVertical]);

  const grouped: Record<string, any[]> = {};
  for (const col of STATUS_COLUMNS) grouped[col.key] = [];
  for (const task of tasks) {
    if (grouped[task.status]) grouped[task.status].push(task);
  }

  const totalActive = (grouped["in_progress"]?.length ?? 0) + (grouped["review"]?.length ?? 0);

  return (
    <div className="max-w-full">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37]">Fila de Tarefas</h1>
          <p className="text-[#F5F5F5]/30 text-xs mt-0.5">{tasks.length} tarefas · {totalActive} em execução</p>
        </div>
        <div className="flex gap-2">
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="bg-[#1a1a1a] border border-[#D4AF37]/20 text-[#F5F5F5]/70 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
            <option value="">Agente: Todos</option>
            {["mariana","atena","hefesto","apollo","afrodite","hera","ares","hestia"].map(a =>
              <option key={a} value={a} className="bg-[#1a1a1a] capitalize">{a.charAt(0).toUpperCase()+a.slice(1)}</option>
            )}
          </select>
          <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)}
            className="bg-[#1a1a1a] border border-[#D4AF37]/20 text-[#F5F5F5]/70 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
            <option value="">Vertical: Todas</option>
            {["STM Capital","STM Digital","AgiSales","Interno","STM Consultancy","STM Health"].map(v =>
              <option key={v} value={v} className="bg-[#1a1a1a]">{v}</option>
            )}
          </select>
          {(filterAgent || filterVertical) && (
            <button onClick={() => { setFilterAgent(""); setFilterVertical(""); }}
              className="px-3 py-2 text-[10px] text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 border border-white/10 rounded-lg">
              Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map(col => (
            <div key={col.key} className="space-y-2">
              <div className="h-6 bg-white/5 rounded animate-pulse" />
              {[1,2,3].map(i => <div key={i} className="h-24 bg-[#141414] rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map(col => {
            const items = grouped[col.key] ?? [];
            return (
              <div key={col.key} className="flex flex-col">
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${col.border}`}>
                  <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                  <span className="ml-auto text-xs opacity-50">{items.length}</span>
                </div>

                <div
                  className="flex flex-col gap-2 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                  style={{ maxHeight: "520px" }}
                >
                  {items.length === 0 ? (
                    <p className="text-[#F5F5F5]/15 text-xs text-center py-8">—</p>
                  ) : items.map(task => (
                    <div key={task.id}
                      className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl p-3 hover:border-[#D4AF37]/30 hover:bg-[#181818] transition-all duration-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {task.code && (
                          <span className="text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37]/60 border border-[#D4AF37]/15 px-1.5 py-0.5 rounded">
                            {task.code}
                          </span>
                        )}
                        <span className="text-[10px]">{PRIORITY_ICON[task.priority] ?? "🟡"}</span>
                        {task.approval_status === "pending" && (
                          <span className="ml-auto text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                            Aprovação
                          </span>
                        )}
                      </div>

                      <p className="text-[#F5F5F5]/85 text-xs font-medium leading-snug line-clamp-2 mb-2">
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
                        {task.agents && <span className="text-[#D4AF37]/50 text-[10px]">@{task.agents.name}</span>}
                        {task.vertical && (
                          <span className={`text-[10px] ${VERTICAL_COLORS[task.vertical] ?? "text-white/30"}`}>
                            {task.vertical}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[#F5F5F5]/20 text-[10px]">
                          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {task.deliverable_url && (
                          <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37]">
                            {task.deliverable_type === "video" ? "🎬" :
                             task.deliverable_type === "image" ? "🖼" :
                             task.deliverable_type === "document" ? "📄" : "🔗"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {items.length > 5 && (
                  <p className="text-[#F5F5F5]/20 text-[10px] text-center mt-1.5">
                    ↕ role para ver todos ({items.length})
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
