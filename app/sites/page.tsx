"use client";

import { useState } from "react";
import { SITES_DATA, SITE_STATUS_CONFIG, VERTICAL_COLOR } from "@/lib/sites-data";
import type { SiteData, SiteStatus, SiteVertical } from "@/lib/sites-data";
import { ExternalLink, Github, Globe, ChevronDown, ChevronUp, Code2 } from "lucide-react";

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};

const VERTICALS: SiteVertical[] = ["STM Capital", "STM Digital", "AgiSales", "STM Group", "Interno"];
const STATUSES: SiteStatus[] = ["online", "em_desenvolvimento", "planejado", "offline"];

export default function SitesPage() {
  const [filterVertical, setFilterVertical] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SITES_DATA.filter((s) => {
    if (filterVertical && s.vertical !== filterVertical) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const onlineCount = SITES_DATA.filter((s) => s.status === "online").length;
  const devCount = SITES_DATA.filter((s) => s.status === "em_desenvolvimento").length;

  return (
    <div className="flex-1 p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Globe size={18} className="text-[#D4AF37]" />
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Sites & Páginas</h1>
        </div>
        <p className="text-[#F5F5F5]/40 text-sm">Todas as presences digitais da STM Group</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={SITES_DATA.length} color="#D4AF37" />
        <StatCard label="Online" value={onlineCount} color="#22C55E" />
        <StatCard label="Em Dev" value={devCount} color="#F59E0B" />
        <StatCard label="Planejados" value={SITES_DATA.filter(s => s.status === "planejado").length} color="#7B9EA8" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilterVertical("")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!filterVertical ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]" : "border-[#D4AF37]/10 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"}`}>
          Todas verticais
        </button>
        {VERTICALS.filter(v => SITES_DATA.some(s => s.vertical === v)).map((v) => (
          <button key={v} onClick={() => setFilterVertical(filterVertical === v ? "" : v)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={filterVertical === v
              ? { backgroundColor: `${VERTICAL_COLOR[v]}20`, borderColor: `${VERTICAL_COLOR[v]}50`, color: VERTICAL_COLOR[v] }
              : { borderColor: "rgba(212,175,55,0.1)", color: "rgba(245,245,245,0.4)" }}>
            {v}
          </button>
        ))}

        <div className="flex gap-1.5 ml-2">
          {STATUSES.filter(s => SITES_DATA.some(d => d.status === s)).map((s) => {
            const cfg = SITE_STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5"
                style={filterStatus === s
                  ? { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40`, color: cfg.color }
                  : { borderColor: "rgba(212,175,55,0.1)", color: "rgba(245,245,245,0.35)" }}>
                <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((site) => {
          const isExpanded = expanded === site.id;
          const statusCfg = SITE_STATUS_CONFIG[site.status];
          return (
            <div key={site.id}
              className={`bg-[#111] border rounded-2xl transition-all duration-200 overflow-hidden ${isExpanded ? "border-[#D4AF37]/30" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/20"}`}>
              {/* Card header */}
              <button className="w-full p-4 flex items-start gap-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : site.id)}>
                {/* Status indicator */}
                <div className="flex flex-col items-center gap-1 mt-1 flex-shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot} ${site.status === "online" ? "animate-pulse" : ""}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#F5F5F5]">{site.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: VERTICAL_COLOR[site.vertical], borderColor: `${VERTICAL_COLOR[site.vertical]}30`, backgroundColor: `${VERTICAL_COLOR[site.vertical]}08` }}>
                          {site.vertical}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30`, backgroundColor: `${statusCfg.color}08` }}>
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] text-[#F5F5F5]/30">{site.type}</span>
                      </div>

                      {/* URL */}
                      <a href={site.url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors mt-1">
                        <ExternalLink size={10} />
                        {site.url.replace("https://", "")}
                      </a>

                      <p className="text-xs text-[#F5F5F5]/45 mt-1.5 leading-relaxed line-clamp-2">
                        {site.description}
                      </p>
                    </div>
                  </div>

                  {/* Stack pills + responsible */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {site.stack.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37]/40">
                        {tech}
                      </span>
                    ))}
                    {site.stack.length > 3 && (
                      <span className="text-[10px] text-[#F5F5F5]/25">+{site.stack.length - 3}</span>
                    )}
                    <span className="ml-auto text-[10px] text-[#F5F5F5]/30 flex items-center gap-1">
                      {AGENT_EMOJI[site.responsible]} {site.responsible}
                    </span>
                  </div>
                </div>

                <span className="text-[#F5F5F5]/20 flex-shrink-0 mt-1">
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-[#D4AF37]/8 pt-4 space-y-4">
                  {/* Description full */}
                  <p className="text-sm text-[#F5F5F5]/55 leading-relaxed">{site.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Features */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-widest mb-2">Funcionalidades</p>
                      <ul className="space-y-1.5">
                        {site.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#F5F5F5]/50">
                            <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: VERTICAL_COLOR[site.vertical] }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      {/* Stack completo */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Code2 size={10} /> Stack
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {site.stack.map((tech) => (
                            <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37]/50">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex flex-col gap-2">
                        <a href={site.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-[#F5F5F5]/50 hover:text-[#D4AF37] transition-colors">
                          <Globe size={11} /> {site.url}
                        </a>
                        {site.repo && (
                          <a href={site.repo} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#F5F5F5]/50 hover:text-[#D4AF37] transition-colors">
                            <Github size={11} /> {site.repo.replace("https://github.com/", "")}
                          </a>
                        )}
                      </div>

                      {/* Responsável */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#D4AF37]/50 uppercase tracking-widest mb-1">Responsável</p>
                        <p className="text-xs text-[#F5F5F5]/50">
                          {AGENT_EMOJI[site.responsible]} {site.responsible}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {site.notes && (
                    <div className="bg-[#0A0A0A] border border-[#D4AF37]/8 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-wider mb-1">Notas</p>
                      <p className="text-xs text-[#F5F5F5]/40 leading-relaxed">{site.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center py-12 text-[#F5F5F5]/30 text-sm">Nenhum site com esses filtros</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111] border border-[#D4AF37]/8 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5">{label}</p>
    </div>
  );
}
