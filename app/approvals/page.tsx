"use client";

import { useState, useEffect } from "react";
import { supabase, Task } from "@/lib/supabase";
import ApprovalCard from "@/components/ApprovalCard";

type ApprovalStatus = "approved" | "adjusted" | "rejected";

const STATUS_BADGE: Record<ApprovalStatus, { label: string; className: string }> = {
  approved: { label: "✅ Aprovado", className: "bg-green-500/15 text-green-400 border-green-500/20" },
  adjusted: { label: "🔄 Ajustado", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  rejected: { label: "❌ Rejeitado", className: "bg-red-500/15 text-red-400 border-red-500/20" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*, agents(id, name, role, model)")
          .eq("approval_status", "pending")
          .order("priority", { ascending: true })
          .order("updated_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("*, agents(id, name, role, model)")
          .in("approval_status", ["approved", "adjusted", "rejected"])
          .order("updated_at", { ascending: false })
          .limit(20),
      ]);
      setPendingTasks((pendingRes.data ?? []) as Task[]);
      setHistoryTasks((historyRes.data ?? []) as Task[]);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  const tabs = [
    { key: "pending" as const, label: "Pendentes", count: pendingTasks.length },
    { key: "history" as const, label: "Histórico", count: null },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Central de Aprovações</h1>
        <p className="text-[#F5F5F5]/40 text-sm mt-1">Gerencie as entregas dos agentes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#141414] p-1 rounded-lg border border-white/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20"
                : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#F5F5F5]/30 text-sm">Carregando...</div>
      ) : tab === "pending" ? (
        pendingTasks.length > 0 ? (
          <div className="space-y-6">
            {pendingTasks.map((task) => (
              <ApprovalCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">✓</div>
            <p className="text-[#F5F5F5]/30 text-sm text-center">
              Todos os itens foram revisados.
              <br />Nada pendente por aqui.
            </p>
          </div>
        )
      ) : (
        historyTasks.length > 0 ? (
          <div className="space-y-3">
            {historyTasks.map((task) => {
              const status = task.approval_status as ApprovalStatus;
              const badge = STATUS_BADGE[status];
              return (
                <div
                  key={task.id}
                  className="bg-[#141414] border border-white/5 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F5F5F5] text-sm font-medium leading-snug truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[#F5F5F5]/40">
                        {task.agents && <span>@{task.agents.name}</span>}
                        {task.code && <span className="text-[#F5F5F5]/25">{task.code}</span>}
                        <span>{formatDate(task.updated_at)}</span>
                      </div>
                    </div>
                    {badge && (
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {task.feedback && (
                    <p className="mt-2 text-xs text-[#F5F5F5]/40 italic border-t border-white/5 pt-2 leading-relaxed">
                      {task.feedback}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-4xl">📋</div>
            <p className="text-[#F5F5F5]/30 text-sm text-center">Nenhum item no histórico ainda.</p>
          </div>
        )
      )}
    </div>
  );
}
