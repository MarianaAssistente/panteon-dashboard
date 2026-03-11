"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Project } from "./ProjectCard";

const priorityLabel = ["", "Alta", "Média", "Baixa"];
const priorityColor = ["", "text-red-400", "text-yellow-400", "text-zinc-400"];

function agentName(id?: string) {
  const map: Record<string, string> = {
    mariana: "Mariana", atena: "Atena", hefesto: "Hefesto",
    apollo: "Apollo", afrodite: "Afrodite", hera: "Hera",
    ares: "Ares", hestia: "Héstia",
  };
  return id ? (map[id] ?? id) : "—";
}

interface RelatedTask {
  id: string;
  title: string;
  status: string;
  agent_id?: string;
}

export default function ProjectDrawer({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const [tasks, setTasks] = useState<RelatedTask[]>([]);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    setProgress(project.progress);

    supabase
      .from("tasks")
      .select("id, title, status, agent_id")
      .eq("vertical", project.vertical)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setTasks(data ?? []));
  }, [project]);

  const saveProgress = useCallback(async () => {
    if (!project) return;
    setSaving(true);
    await supabase
      .from("projects")
      .update({ progress })
      .eq("id", project.id);
    setSaving(false);
  }, [project, progress]);

  if (!project) return null;

  const statusColorMap: Record<string, string> = {
    in_progress: "text-blue-400", done: "text-green-400",
    blocked: "text-red-400", review: "text-yellow-400",
    backlog: "text-zinc-400",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0D0D0D] border-l border-[#D4AF37]/15 z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#D4AF37]/10 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[#F5F5F5] font-bold text-lg leading-tight">{project.name}</h2>
            {project.description && (
              <p className="text-[#F5F5F5]/40 text-sm mt-1">{project.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Vertical", value: project.vertical },
              { label: "Fase", value: project.phase ?? "—", className: "capitalize" },
              {
                label: "Prioridade",
                value: priorityLabel[project.priority] ?? "—",
                className: priorityColor[project.priority],
              },
              { label: "Responsável", value: agentName(project.lead_agent_id) },
            ].map((m) => (
              <div key={m.label} className="bg-white/3 rounded-xl p-3">
                <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider mb-1">{m.label}</p>
                <p className={`text-sm text-[#F5F5F5] font-medium ${m.className ?? ""}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Progress editor */}
          <div className="bg-white/3 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#F5F5F5]/50 uppercase tracking-wider">Progresso</p>
              <span className="text-[#D4AF37] font-bold text-sm">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-[#D4AF37]"
            />
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D06F] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress !== project.progress && (
              <button
                onClick={saveProgress}
                disabled={saving}
                className="w-full py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar Progresso"}
              </button>
            )}
          </div>

          {/* Links */}
          {(project.notion_url || project.trello_url || project.drive_url) && (
            <div className="space-y-2">
              <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">Links</p>
              <div className="flex flex-wrap gap-2">
                {project.notion_url && (
                  <a
                    href={project.notion_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                  >
                    <ExternalLink size={11} /> Notion
                  </a>
                )}
                {project.trello_url && (
                  <a
                    href={project.trello_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                  >
                    <ExternalLink size={11} /> Trello
                  </a>
                )}
                {project.drive_url && (
                  <a
                    href={project.drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                  >
                    <ExternalLink size={11} /> Drive
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={10} /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#D4AF37]/8 text-[#D4AF37]/70 border border-[#D4AF37]/15 rounded-full text-[10px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related tasks */}
          <div className="space-y-2">
            <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">
              Tarefas — {project.vertical}
            </p>
            {tasks.length === 0 ? (
              <p className="text-[#F5F5F5]/20 text-xs italic">Nenhuma tarefa encontrada.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-[#F5F5F5]/70 truncate flex-1 mr-2">{t.title}</span>
                    <span className={`text-[10px] shrink-0 ${statusColorMap[t.status] ?? "text-zinc-400"}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
