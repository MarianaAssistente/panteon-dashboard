"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { AGENTS_STATIC } from "@/lib/supabase";

const VERTICALS = [
  "STM Capital", "STM Digital", "STM Consultancy",
  "STM Health", "AgiSales", "Interno",
];

const STATUSES = [
  { value: "backlog",     label: "Backlog" },
  { value: "in_progress", label: "Em Progresso" },
  { value: "review",      label: "Review" },
  { value: "blocked",     label: "Bloqueado" },
  { value: "done",        label: "Concluído" },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, sp]
  );

  const agent = sp.get("agent") ?? "";
  const vertical = sp.get("vertical") ?? "";
  const status = sp.get("status") ?? "";

  const selectClass =
    "bg-[#141414] border border-[#D4AF37]/15 text-[#F5F5F5]/70 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/40 transition-colors cursor-pointer";

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Agent filter */}
      <select
        value={agent}
        onChange={(e) => setParam("agent", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os agentes</option>
        {AGENTS_STATIC.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.role})
          </option>
        ))}
      </select>

      {/* Vertical filter */}
      <select
        value={vertical}
        onChange={(e) => setParam("vertical", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os projetos</option>
        {VERTICALS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => setParam("status", e.target.value)}
        className={selectClass}
      >
        <option value="">Todos os status</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear */}
      {(agent || vertical || status) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-[#F5F5F5]/30 hover:text-[#F5F5F5]/70 px-3 py-2 border border-white/5 rounded-lg transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
