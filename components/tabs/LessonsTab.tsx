"use client";

import { useState } from "react";
import { LESSONS_DATA, LESSON_CATEGORIES } from "@/lib/lessons-data";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";

const IMPACT_COLOR: Record<string, string> = {
  "crítico": "#EF4444",
  "alto":    "#F59E0B",
  "médio":   "#7B9EA8",
};

export default function LessonsTab() {
  const [filterCat, setFilterCat] = useState("");
  const [filterImpact, setFilterImpact] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = LESSONS_DATA.filter((l) => {
    if (filterCat && l.category !== filterCat) return false;
    if (filterImpact && l.impact !== filterImpact) return false;
    return true;
  }).sort((a, b) => {
    const order = { "crítico": 0, "alto": 1, "médio": 2 };
    return order[a.impact] - order[b.impact];
  });

  const criticalCount = LESSONS_DATA.filter((l) => l.impact === "crítico").length;
  const altoCount = LESSONS_DATA.filter((l) => l.impact === "alto").length;

  return (
    <div className="p-6">
      {/* Header info */}
      <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-4 mb-6">
        <p className="text-sm text-[#F5F5F5]/60 leading-relaxed">
          Decisões técnicas e arquiteturais consolidadas ao longo da operação do Panteão.
          Estas lições previnem que os agentes repitam erros já mapeados e garantem
          consistência nas decisões do sistema.
        </p>
        <div className="flex gap-4 mt-3">
          <span className="text-xs text-[#F5F5F5]/40">
            <span className="text-[#D4AF37] font-semibold">{LESSONS_DATA.length}</span> lições registradas
          </span>
          <span className="text-xs text-[#F5F5F5]/40">
            <span className="text-red-400 font-semibold">{criticalCount}</span> críticas
          </span>
          <span className="text-xs text-[#F5F5F5]/40">
            <span className="text-[#F59E0B] font-semibold">{altoCount}</span> alto impacto
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterCat("")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!filterCat ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]" : "border-[#D4AF37]/10 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"}`}>
          Todas
        </button>
        {LESSON_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? "" : cat.id)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1"
            style={filterCat === cat.id
              ? { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}50`, color: cat.color }
              : { borderColor: "rgba(212,175,55,0.1)", color: "rgba(245,245,245,0.4)" }}>
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}

        <div className="flex gap-1 ml-1">
          {(["crítico", "alto", "médio"] as const).map((imp) => (
            <button key={imp} onClick={() => setFilterImpact(filterImpact === imp ? "" : imp)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors capitalize ${filterImpact === imp ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              style={filterImpact === imp
                ? { backgroundColor: `${IMPACT_COLOR[imp]}15`, borderColor: `${IMPACT_COLOR[imp]}40`, color: IMPACT_COLOR[imp] }
                : { borderColor: "rgba(212,175,55,0.1)", color: "rgba(245,245,245,0.5)" }}>
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons list */}
      <div className="space-y-2">
        {filtered.map((lesson) => {
          const isExpanded = expanded === lesson.id;
          const cat = LESSON_CATEGORIES.find((c) => c.id === lesson.category);
          return (
            <div key={lesson.id}
              className={`bg-[#111] border rounded-2xl transition-all duration-200 overflow-hidden ${isExpanded ? "border-[#D4AF37]/25" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/18"}`}>
              <button className="w-full p-4 flex items-start gap-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : lesson.id)}>
                {/* Impact indicator */}
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: IMPACT_COLOR[lesson.impact] }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono text-[#D4AF37]/35">{lesson.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1"
                      style={{ color: cat?.color, borderColor: `${cat?.color}25`, backgroundColor: `${cat?.color}08` }}>
                      {cat?.emoji} {lesson.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                      style={{ color: IMPACT_COLOR[lesson.impact], backgroundColor: `${IMPACT_COLOR[lesson.impact]}10` }}>
                      {lesson.impact}
                    </span>
                    <span className="text-[10px] text-[#F5F5F5]/20">{lesson.date}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5] leading-snug">{lesson.title}</h3>

                  {/* Rule — always visible */}
                  <div className="flex items-start gap-1.5 mt-2 bg-[#D4AF37]/5 border border-[#D4AF37]/12 rounded-lg px-2.5 py-1.5">
                    <CheckCircle size={10} className="text-[#D4AF37]/50 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#D4AF37]/70 leading-relaxed font-medium">{lesson.rule}</p>
                  </div>
                </div>

                <span className="text-[#F5F5F5]/20 flex-shrink-0 mt-1">
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#D4AF37]/8 pt-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={11} className="text-red-400/60" />
                      <p className="text-[10px] font-semibold text-red-400/50 uppercase tracking-widest">O Problema</p>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{lesson.problem}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle size={11} className="text-emerald-400/60" />
                      <p className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-widest">A Solução</p>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{lesson.solution}</p>
                  </div>
                  {lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lesson.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37]/40">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
