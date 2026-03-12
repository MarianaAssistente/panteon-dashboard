"use client";

import { useEffect, useState } from "react";
import { supabase, Delivery, DailyMetric } from "@/lib/supabase";
import Timeline from "@/components/Timeline";
import { subDays } from "date-fns";

const VERTICALS = ["STM Capital", "STM Digital", "STM Consultancy", "STM Health", "AgiSales", "Interno"];
const AGENTS = ["mariana", "atena", "hefesto", "apollo", "afrodite", "hera", "ares", "hestia"];
const AGENT_NAMES: Record<string, string> = {
  mariana: "Mariana", atena: "Atena", hefesto: "Hefesto", apollo: "Apollo",
  afrodite: "Afrodite", hera: "Hera", ares: "Ares", hestia: "Héstia",
};

export default function HistoryPage() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = subDays(new Date(), period).toISOString();
    setLoading(true);

    Promise.all([
      // Busca deliveries reais
      supabase
        .from("deliveries")
        .select("*, agents(id, name, role), tasks(title)")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_metrics")
        .select("*, agents(id, name, role)")
        .gte("date", since.split("T")[0])
        .order("date", { ascending: false }),
      // Fallback: tasks concluídas no período
      supabase
        .from("tasks")
        .select("id, code, title, agent_id, vertical, deliverable_url, completed_at, updated_at")
        .eq("status", "done")
        .gte("updated_at", since)
        .order("updated_at", { ascending: false }),
    ]).then(([dRes, mRes, tRes]) => {
      let dels = (dRes.data ?? []) as Delivery[];
      // Se não há deliveries, usar tasks done como fallback
      if (dels.length === 0 && tRes.data && tRes.data.length > 0) {
        dels = tRes.data.map((t: any) => ({
          id: t.id,
          task_id: t.id,
          agent_id: t.agent_id,
          title: t.title,
          description: t.code ? `${t.code} · ${t.vertical ?? ""}` : t.vertical ?? "",
          drive_url: t.deliverable_url,
          status: "approved" as const,
          created_at: t.completed_at ?? t.updated_at,
          agents: { id: t.agent_id, name: t.agent_id, role: "" },
        }));
      }
      setDeliveries(dels);
      setMetrics((mRes.data ?? []) as DailyMetric[]);
      setLoading(false);
    });
  }, [period]);

  // Aggregates
  const totalTasks = metrics.reduce((s, m) => s + m.tasks_completed, 0);
  const totalDeliveries = metrics.reduce((s, m) => s + m.deliveries_made, 0);
  const totalCost = metrics.reduce((s, m) => s + Number(m.estimated_cost_usd), 0);

  // Cost by agent
  const costByAgent: Record<string, number> = {};
  for (const m of metrics) {
    if (m.agent_id) {
      costByAgent[m.agent_id] = (costByAgent[m.agent_id] ?? 0) + Number(m.estimated_cost_usd);
    }
  }

  // Cost by vertical — from tasks (approximation: not stored in metrics, show placeholder note)
  const hasData = metrics.length > 0 || deliveries.length > 0;

  function handleExport() {
    const lines = [
      `# Relatório Panteão do Olimpo — Últimos ${period} dias`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      "",
      `## Resumo`,
      `- Tarefas concluídas: ${totalTasks}`,
      `- Entregas realizadas: ${totalDeliveries}`,
      `- Custo estimado: $${totalCost.toFixed(2)} USD`,
      "",
      `## Custo por Agente`,
      ...Object.entries(costByAgent).map(([id, cost]) => `- ${AGENT_NAMES[id] ?? id}: $${cost.toFixed(4)}`),
      "",
      `## Entregas`,
      ...deliveries.map(
        (d) =>
          `- [${d.status === "approved" ? "✅" : d.status === "rejected" ? "❌" : "⏳"}] ${d.title} (@${d.agents?.name ?? "?"}) — ${new Date(d.created_at).toLocaleDateString("pt-BR")}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `panteon-report-${period}d-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Histórico & Métricas</h1>
          <p className="text-[#F5F5F5]/40 text-sm mt-1">Visão geral das entregas e custos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex bg-[#141414] border border-[#D4AF37]/15 rounded-lg overflow-hidden">
            {([7, 30] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm transition-colors ${
                  period === p
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
          {/* Export button */}
          <button
            onClick={handleExport}
            className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ↓ Exportar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#F5F5F5]">{totalTasks}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Tarefas concluídas</p>
        </div>
        <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#F5F5F5]">{totalDeliveries}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Entregas realizadas</p>
        </div>
        <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#D4AF37]">${totalCost.toFixed(2)}</p>
          <p className="text-[#F5F5F5]/30 text-xs mt-1">Custo estimado (USD)</p>
        </div>
      </div>

      {/* Cost breakdown by agent */}
      {Object.keys(costByAgent).length > 0 && (
        <section className="mb-8">
          <p className="text-[#F5F5F5]/30 text-xs font-semibold uppercase tracking-wider mb-4">
            Custo por agente
          </p>
          <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl overflow-hidden">
            {Object.entries(costByAgent)
              .sort((a, b) => b[1] - a[1])
              .map(([agentId, cost], i, arr) => {
                const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                return (
                  <div
                    key={agentId}
                    className={`flex items-center gap-4 px-4 py-3 ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <span className="text-[#F5F5F5]/60 text-sm w-20 shrink-0">
                      {AGENT_NAMES[agentId] ?? agentId}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37]/50 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[#D4AF37]/60 text-xs font-mono w-20 text-right shrink-0">
                      ${cost.toFixed(4)}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section>
        <p className="text-[#F5F5F5]/30 text-xs font-semibold uppercase tracking-wider mb-6">
          Timeline de entregas
        </p>
        {loading ? (
          <div className="text-center py-12 text-[#F5F5F5]/20 text-sm">Carregando...</div>
        ) : (
          <Timeline deliveries={deliveries} />
        )}
      </section>
    </div>
  );
}
