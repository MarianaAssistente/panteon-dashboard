"use client";

import { ExternalLink } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  description?: string;
  vertical: string;
  status: string;
  phase?: string;
  priority: number;
  lead_agent_id?: string;
  notion_url?: string;
  trello_url?: string;
  drive_url?: string;
  start_date?: string;
  deadline?: string;
  progress: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  agents?: { id: string; name: string; status: string };
}

const verticalColors: Record<string, string> = {
  "STM Capital":     "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30",
  "STM Digital":     "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "AgiSales":        "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Interno":         "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  "STM Consultancy": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "STM Health":      "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const statusColors: Record<string, string> = {
  active:    "bg-green-500/15 text-green-400 border-green-500/30",
  paused:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  completed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Ativo", paused: "Pausado", completed: "Concluído", cancelled: "Cancelado",
};

const agentStatusDot: Record<string, string> = {
  working: "bg-green-400",
  idle:    "bg-yellow-400",
  blocked: "bg-red-400",
};

function agentName(id?: string) {
  const map: Record<string, string> = {
    mariana: "Mariana", atena: "Atena", hefesto: "Hefesto",
    apollo: "Apollo", afrodite: "Afrodite", hera: "Hera",
    ares: "Ares", hestia: "Héstia",
  };
  return id ? (map[id] ?? id) : "—";
}

export default function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const isOverdue =
    project.deadline && new Date(project.deadline) < new Date() && project.status === "active";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-[#111111] border border-[#D4AF37]/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/4 transition-all duration-200 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[#F5F5F5] font-semibold text-sm leading-tight group-hover:text-[#D4AF37] transition-colors">
          {project.code && (
            <span className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37]/70 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded mr-1.5 align-middle">{project.code}</span>
          )}
          {project.name}
        </h3>
        <div className="flex gap-1.5 shrink-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              verticalColors[project.vertical] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
            }`}
          >
            {project.vertical}
          </span>
        </div>
      </div>

      {/* Status + Phase */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            statusColors[project.status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
          }`}
        >
          {statusLabels[project.status] ?? project.status}
        </span>
        {project.phase && (
          <span className="text-[10px] text-[#F5F5F5]/40 capitalize">{project.phase}</span>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-[#F5F5F5]/40">
          <span>Progresso</span>
          <span className="text-[#D4AF37]">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D06F] rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Agent + Deadline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              agentStatusDot[project.agents?.status ?? "idle"]
            }`}
          />
          <span className="text-[11px] text-[#F5F5F5]/50">
            {agentName(project.lead_agent_id)}
          </span>
        </div>
        {project.deadline && (
          <span className={`text-[10px] ${isOverdue ? "text-red-400" : "text-[#F5F5F5]/30"}`}>
            {isOverdue ? "⚠ " : ""}
            {new Date(project.deadline).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      {/* Quick links */}
      {(project.notion_url || project.trello_url || project.drive_url) && (
        <div className="flex gap-2 border-t border-white/5 pt-3">
          {project.notion_url && (
            <a
              href={project.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-[#F5F5F5]/30 hover:text-[#F5F5F5]/70 transition-colors"
            >
              <ExternalLink size={10} /> Notion
            </a>
          )}
          {project.trello_url && (
            <a
              href={project.trello_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-[#F5F5F5]/30 hover:text-[#F5F5F5]/70 transition-colors"
            >
              <ExternalLink size={10} /> Trello
            </a>
          )}
          {project.drive_url && (
            <a
              href={project.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-[#F5F5F5]/30 hover:text-[#F5F5F5]/70 transition-colors"
            >
              <ExternalLink size={10} /> Drive
            </a>
          )}
        </div>
      )}
    </div>
  );
}
