"use client";

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://duogqvusxueetapcvsfp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzEzMTgsImV4cCI6MjA4ODQwNzMxOH0.QVhn2X8oXZ88nxKD3snvDUxwmlfsK80IM1n-4iINg1o";

interface AgentMetric {
  agent_id: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model_tier: "sonnet" | "haiku";
}

interface CostData {
  updated_at: string;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  agents: AgentMetric[];
  budget_daily: number;
  budget_monthly: number;
}

function fmtUSD(v: number) {
  return `$${v.toFixed(4)}`;
}

function fmtTokens(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/knowledge?code=eq.COSTS-METRICS&select=content`,
          { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
        );
        const rows = await res.json();
        if (rows && rows.length > 0) {
          setData(JSON.parse(rows[0].content) as CostData);
        } else {
          setError("Nenhum dado encontrado. Execute push-costs.py.");
        }
      } catch (e) {
        setError("Erro ao carregar métricas.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Carregando métricas...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-red-400">{error || "Erro desconhecido."}</div>
    );
  }

  // Days since first agent session (approximation: use updated_at vs a fixed start date)
  const startDate = new Date("2026-03-01");
  const now = new Date();
  const daysSinceStart = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const estimatedDailySpend = data.total_cost_usd / daysSinceStart;
  const dailyPct = (estimatedDailySpend / data.budget_daily) * 100;
  const monthlyPct = (data.total_cost_usd / data.budget_monthly) * 100;

  const sortedAgents = [...data.agents].sort((a, b) => b.cost_usd - a.cost_usd);
  const maxCost = sortedAgents[0]?.cost_usd || 1;

  const budgetAlert = data.total_cost_usd > 3.75;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        📊 Analytics & Custos
      </h1>

      {budgetAlert && (
        <div className="bg-amber-900/40 border border-amber-500 text-amber-300 rounded-lg px-4 py-3 flex items-center gap-2">
          ⚠️ <span>Custo acumulado (<strong>{fmtUSD(data.total_cost_usd)}</strong>) ultrapassou 75% do limite diário estimado ($3.75).</span>
        </div>
      )}

      {/* Seção 1 — Cards de resumo */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total gasto */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total Gasto (acumulado)</p>
            <p className="text-3xl font-bold text-white">{fmtUSD(data.total_cost_usd)}</p>
            <p className="text-gray-500 text-xs mt-2">
              {fmtTokens(data.total_input_tokens)} in · {fmtTokens(data.total_output_tokens)} out
            </p>
          </div>

          {/* Budget diário */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Budget Diário</p>
            <p className="text-3xl font-bold text-white">${data.budget_daily.toFixed(2)}</p>
            <ProgressBar pct={dailyPct} color={dailyPct > 75 ? "#f59e0b" : "#22c55e"} />
            <p className="text-gray-500 text-xs mt-1">
              ~{fmtUSD(estimatedDailySpend)}/dia ({dailyPct.toFixed(1)}%)
            </p>
          </div>

          {/* Budget mensal */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Budget Mensal</p>
            <p className="text-3xl font-bold text-white">${data.budget_monthly.toFixed(0)}</p>
            <ProgressBar pct={monthlyPct} color={monthlyPct > 75 ? "#f59e0b" : "#6366f1"} />
            <p className="text-gray-500 text-xs mt-1">
              {fmtUSD(data.total_cost_usd)} usado ({monthlyPct.toFixed(1)}%)
            </p>
          </div>
        </div>
      </section>

      {/* Seção 2 — Tabela por agente */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Custo por Agente</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/50 text-gray-400 text-left">
                <th className="px-4 py-3">Agente</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-right">Tokens Input</th>
                <th className="px-4 py-3 text-right">Tokens Output</th>
                <th className="px-4 py-3 text-right">Custo USD</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent, i) => (
                <tr
                  key={agent.agent_id}
                  className={`border-t border-gray-700 ${i % 2 === 0 ? "" : "bg-gray-700/20"}`}
                >
                  <td className="px-4 py-3 font-medium text-white capitalize">{agent.agent_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={
                        agent.model_tier === "sonnet"
                          ? { background: "#3b1f5e", color: "#c4b5fd" }
                          : { background: "#0a3347", color: "#67e8f9" }
                      }
                    >
                      {agent.model_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {agent.input_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {agent.output_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    {fmtUSD(agent.cost_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seção 3 — Gráfico de barras */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Gráfico de Custos</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-end gap-4 h-40">
            {sortedAgents.map((agent) => {
              const heightPct = (agent.cost_usd / maxCost) * 100;
              const color = agent.model_tier === "sonnet" ? "#9B7EC8" : "#06B6D4";
              return (
                <div key={agent.agent_id} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-xs text-gray-400 font-mono">{fmtUSD(agent.cost_usd)}</span>
                  <div className="w-full flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(heightPct, 2)}%`,
                        backgroundColor: color,
                        minHeight: "4px",
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 capitalize truncate w-full text-center">
                    {agent.agent_id}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 justify-end text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#9B7EC8" }} />
              sonnet
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#06B6D4" }} />
              haiku
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-2 text-right">
          Atualizado: {new Date(data.updated_at).toLocaleString("pt-BR")}
        </p>
      </section>
    </div>
  );
}
