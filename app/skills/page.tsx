"use client";

import { useState } from "react";
import { SKILLS_DATA, SKILL_CATEGORIES } from "@/lib/skills-data";
import type { SkillData } from "@/lib/skills-data";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, Cpu } from "lucide-react";

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};
const AGENT_COLOR: Record<string, string> = {
  mariana: "#D4AF37", atena: "#7B9EA8", hefesto: "#B87333", apollo: "#9B7EC8",
  afrodite: "#C8829B", hera: "#8BA888", ares: "#C87B7B", hestia: "#A89B6E",
};

export default function SkillsPage() {
  const [selected, setSelected] = useState<SkillData | null>(null);
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SKILLS_DATA.filter((s) => {
    if (filterCat && s.category !== filterCat) return false;
    if (filterAgent && !s.agents.includes(filterAgent)) return false;
    return true;
  });

  return (
    <div className="flex h-full">
      {/* Main */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Cpu size={18} className="text-[#D4AF37]" />
            <h1 className="text-xl font-semibold text-[#F5F5F5]">Skills do Sistema</h1>
            <span className="text-xs bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
              {SKILLS_DATA.length} instaladas
            </span>
          </div>
          <p className="text-[#F5F5F5]/40 text-sm">
            Capacidades especializadas disponíveis para os agentes do Panteão
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCat("")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              !filterCat
                ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]"
                : "border-[#D4AF37]/10 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
            }`}
          >
            Todas
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(filterCat === cat.id ? "" : cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filterCat === cat.id
                  ? "border-opacity-50 text-white"
                  : "border-[#D4AF37]/10 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
              }`}
              style={
                filterCat === cat.id
                  ? { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}50`, color: cat.color }
                  : {}
              }
            >
              {cat.label}
            </button>
          ))}

          {/* Agent filter */}
          <div className="ml-2 flex gap-1.5 items-center">
            <span className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider">Agente:</span>
            {Object.keys(AGENT_EMOJI).map((ag) => (
              <button
                key={ag}
                onClick={() => setFilterAgent(filterAgent === ag ? "" : ag)}
                title={ag}
                className={`w-7 h-7 rounded-full border text-sm transition-all ${
                  filterAgent === ag ? "scale-110 border-opacity-60" : "border-[#F5F5F5]/10 opacity-50 hover:opacity-80"
                }`}
                style={filterAgent === ag ? { borderColor: AGENT_COLOR[ag], backgroundColor: `${AGENT_COLOR[ag]}15` } : {}}
              >
                {AGENT_EMOJI[ag]}
              </button>
            ))}
          </div>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((skill) => {
            const isExpanded = expanded === skill.id;
            const cat = SKILL_CATEGORIES.find((c) => c.id === skill.category);
            return (
              <div
                key={skill.id}
                className={`bg-[#111] border rounded-2xl transition-all duration-200 overflow-hidden ${
                  selected?.id === skill.id ? "border-[#D4AF37]/40" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/20"
                }`}
              >
                {/* Card header */}
                <button
                  className="w-full p-4 flex items-start gap-4 text-left"
                  onClick={() => {
                    setSelected(skill);
                    setExpanded(isExpanded ? null : skill.id);
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border"
                    style={{ backgroundColor: `${skill.color}12`, borderColor: `${skill.color}25` }}
                  >
                    {skill.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#F5F5F5]">{skill.name}</h3>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border capitalize"
                        style={{ color: cat?.color, borderColor: `${cat?.color}30`, backgroundColor: `${cat?.color}10` }}
                      >
                        {skill.category}
                      </span>
                      {skill.homepage && (
                        <a
                          href={skill.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-[#F5F5F5]/25 hover:text-[#D4AF37]/60 flex items-center gap-0.5 transition-colors"
                        >
                          <ExternalLink size={9} /> docs
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-[#F5F5F5]/50 mt-1 leading-relaxed line-clamp-2">
                      {skill.description}
                    </p>
                    {/* Agents */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {skill.agents.map((ag) => (
                        <span
                          key={ag}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border"
                          style={{ borderColor: `${AGENT_COLOR[ag]}25`, color: AGENT_COLOR[ag], backgroundColor: `${AGENT_COLOR[ag]}08` }}
                        >
                          {AGENT_EMOJI[ag]} {ag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expand icon */}
                  <span className="text-[#F5F5F5]/25 flex-shrink-0 mt-1">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#D4AF37]/8 pt-4 space-y-4">
                    {/* Como usamos */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-widest mb-2">
                        Como usamos no Panteão
                      </p>
                      <p className="text-sm text-[#F5F5F5]/60 leading-relaxed">{skill.howWeUse}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quando usar */}
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <CheckCircle size={10} /> Quando usar
                        </p>
                        <ul className="space-y-1.5">
                          {skill.whenToUse.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#F5F5F5]/50">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400/50 flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Quando NÃO usar */}
                      {skill.whenNotToUse && (
                        <div>
                          <p className="text-[10px] font-semibold text-red-400/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <XCircle size={10} /> Quando NÃO usar
                          </p>
                          <ul className="space-y-1.5">
                            {skill.whenNotToUse.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[#F5F5F5]/50">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400/50 flex-shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Requires */}
                    {skill.requires && (
                      <div className="flex items-center gap-2 text-xs text-[#F5F5F5]/30 bg-[#0A0A0A] rounded-lg px-3 py-2">
                        <span className="text-[#D4AF37]/40">⚙</span>
                        <span>Requer: <span className="font-mono text-[#D4AF37]/50">{skill.requires}</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#F5F5F5]/30 text-sm">
              Nenhuma skill encontrada com esses filtros
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {SKILL_CATEGORIES.map((cat) => {
            const count = SKILLS_DATA.filter((s) => s.category === cat.id).length;
            if (!count) return null;
            return (
              <div key={cat.id} className="bg-[#111] border border-[#D4AF37]/8 rounded-xl p-3 text-center">
                <p className="text-lg font-bold" style={{ color: cat.color }}>{count}</p>
                <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5">{cat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
