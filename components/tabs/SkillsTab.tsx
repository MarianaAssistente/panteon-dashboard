"use client";

import { useState } from "react";
import { SKILLS_DATA, SKILL_CATEGORIES } from "@/lib/skills-data";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};
const AGENT_COLOR: Record<string, string> = {
  mariana: "#D4AF37", atena: "#7B9EA8", hefesto: "#B87333", apollo: "#9B7EC8",
  afrodite: "#C8829B", hera: "#8BA888", ares: "#C87B7B", hestia: "#A89B6E",
};

export default function SkillsTab() {
  const [filterCat, setFilterCat] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "ativo" | "inativo">("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SKILLS_DATA.filter((s) => {
    if (filterCat && s.category !== filterCat) return false;
    if (filterAgent && !s.agents.includes(filterAgent)) return false;
    if (filterActive === "ativo" && !s.active) return false;
    if (filterActive === "inativo" && s.active) return false;
    return true;
  });

  const activeCount = SKILLS_DATA.filter((s) => s.active).length;

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="flex gap-4 mb-5">
        <div className="text-xs text-[#F5F5F5]/40">
          <span className="text-[#D4AF37] font-semibold text-lg">{SKILLS_DATA.length}</span> instaladas
        </div>
        <div className="text-xs text-[#F5F5F5]/40">
          <span className="text-emerald-400 font-semibold text-lg">{activeCount}</span> em uso ativo
        </div>
        <div className="text-xs text-[#F5F5F5]/40">
          <span className="text-[#F5F5F5]/30 font-semibold text-lg">{SKILLS_DATA.length - activeCount}</span> disponíveis
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterCat("")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!filterCat ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]" : "border-[#D4AF37]/10 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"}`}>
          Todas
        </button>
        {SKILL_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? "" : cat.id)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={filterCat === cat.id
              ? { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}50`, color: cat.color }
              : { borderColor: "rgba(212,175,55,0.1)", color: "rgba(245,245,245,0.4)" }}>
            {cat.label}
          </button>
        ))}

        <div className="flex gap-1 ml-1">
          {(["", "ativo", "inativo"] as const).map((v) => (
            <button key={v} onClick={() => setFilterActive(v)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterActive === v && v !== "" ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400" : filterActive === v ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]" : "border-[#D4AF37]/10 text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60"}`}>
              {v === "" ? "Todos" : v === "ativo" ? "✓ Em uso" : "○ Disponível"}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 items-center ml-1">
          <span className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider">Agente:</span>
          {Object.keys(AGENT_EMOJI).map((ag) => (
            <button key={ag} onClick={() => setFilterAgent(filterAgent === ag ? "" : ag)} title={ag}
              className={`w-6 h-6 rounded-full border text-xs transition-all ${filterAgent === ag ? "scale-110" : "border-[#F5F5F5]/10 opacity-50 hover:opacity-80"}`}
              style={filterAgent === ag ? { borderColor: AGENT_COLOR[ag], backgroundColor: `${AGENT_COLOR[ag]}15` } : {}}>
              {AGENT_EMOJI[ag]}
            </button>
          ))}
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-2">
        {filtered.map((skill) => {
          const isExpanded = expanded === skill.id;
          const cat = SKILL_CATEGORIES.find((c) => c.id === skill.category);
          return (
            <div key={skill.id}
              className={`bg-[#111] border rounded-2xl transition-all duration-200 overflow-hidden ${isExpanded ? "border-[#D4AF37]/30" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/18"}`}>
              <button className="w-full p-4 flex items-start gap-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : skill.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
                  style={{ backgroundColor: `${skill.color}12`, borderColor: `${skill.color}25` }}>
                  {skill.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{skill.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border capitalize"
                      style={{ color: cat?.color, borderColor: `${cat?.color}30`, backgroundColor: `${cat?.color}10` }}>
                      {skill.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${skill.active ? "bg-emerald-400/10 text-emerald-400" : "bg-[#F5F5F5]/5 text-[#F5F5F5]/25"}`}>
                      {skill.active ? "em uso" : "disponível"}
                    </span>
                    {skill.homepage && (
                      <a href={skill.homepage} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-[#F5F5F5]/20 hover:text-[#D4AF37]/50 flex items-center gap-0.5 transition-colors">
                        <ExternalLink size={9} /> docs
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#F5F5F5]/45 mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {skill.agents.map((ag) => (
                      <span key={ag} className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={{ borderColor: `${AGENT_COLOR[ag]}20`, color: AGENT_COLOR[ag], backgroundColor: `${AGENT_COLOR[ag]}08` }}>
                        {AGENT_EMOJI[ag]} {ag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[#F5F5F5]/20 flex-shrink-0 mt-1">
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#D4AF37]/8 pt-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-widest mb-2">Como usamos no Panteão</p>
                    <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{skill.howWeUse}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <CheckCircle size={10} /> Quando usar
                      </p>
                      <ul className="space-y-1.5">
                        {skill.whenToUse.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#F5F5F5]/45">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400/50 flex-shrink-0" />{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {skill.whenNotToUse && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-400/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <XCircle size={10} /> Quando NÃO usar
                        </p>
                        <ul className="space-y-1.5">
                          {skill.whenNotToUse.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#F5F5F5]/45">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400/50 flex-shrink-0" />{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {skill.requires && (
                    <div className="text-xs text-[#F5F5F5]/30 bg-[#0A0A0A] rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-[#D4AF37]/40">⚙</span>
                      Requer: <span className="font-mono text-[#D4AF37]/50">{skill.requires}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center py-12 text-[#F5F5F5]/30 text-sm">Nenhuma skill com esses filtros</p>
        )}
      </div>
    </div>
  );
}
