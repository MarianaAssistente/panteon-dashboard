"use client";

import { useState } from "react";
import { Task } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskDrawerProps {
  task: Task;
  trigger?: React.ReactNode;
}

export default function TaskDrawer({ task, trigger }: TaskDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-[#0D0D0D] border-l border-[#D4AF37]/15 z-50 overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#D4AF37]/10 p-5 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[#F5F5F5] font-semibold leading-snug">{task.title}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={task.status} type="task" />
              {task.vertical && (
                <span className="text-[#F5F5F5]/40 text-xs">{task.vertical}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] text-xl leading-none transition-colors mt-1"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Agente", value: task.agents ? `${task.agents.name} (${task.agents.role})` : "—" },
              { label: "Prioridade", value: task.priority === 1 ? "Alta" : task.priority === 3 ? "Baixa" : "Média" },
              { label: "Criado", value: format(new Date(task.created_at), "dd/MM/yy HH:mm", { locale: ptBR }) },
              { label: "Atualizado", value: formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR }) },
              task.execution_time_minutes
                ? { label: "Tempo de execução", value: `${task.execution_time_minutes} min` }
                : null,
              task.completed_at
                ? { label: "Concluído", value: format(new Date(task.completed_at), "dd/MM/yy HH:mm", { locale: ptBR }) }
                : null,
            ].filter(Boolean).map((item) => (
              <div key={item!.label} className="bg-[#141414] rounded-lg p-3 border border-white/5">
                <p className="text-[#F5F5F5]/30 mb-0.5">{item!.label}</p>
                <p className="text-[#F5F5F5]/70 font-medium">{item!.value}</p>
              </div>
            ))}
          </div>

          {/* Briefing */}
          {task.description && (
            <section>
              <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-2">Briefing</p>
              <div className="bg-[#141414] rounded-xl p-4 border border-white/5 text-[#F5F5F5]/60 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </div>
            </section>
          )}

          {/* Deliverable */}
          {task.deliverable_url && (
            <section>
              <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-2">Entregável</p>
              <a
                href={task.deliverable_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#141414] rounded-xl p-4 border border-[#D4AF37]/15 hover:border-[#D4AF37]/30 transition-colors text-[#D4AF37]/70 hover:text-[#D4AF37] text-sm"
              >
                {task.deliverable_type === "document" ? "📄" :
                 task.deliverable_type === "image" ? "🖼" :
                 task.deliverable_type === "video" ? "🎬" : "🔗"}
                <span className="truncate">{task.deliverable_url}</span>
                <span className="ml-auto shrink-0">→</span>
              </a>
            </section>
          )}

          {/* Feedback from Yuri */}
          {task.feedback && (
            <section>
              <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-2">Feedback</p>
              <div className="bg-[#D4AF37]/5 rounded-xl p-4 border border-[#D4AF37]/15 text-[#F5F5F5]/60 text-sm leading-relaxed">
                {task.feedback}
              </div>
            </section>
          )}

          {/* Message history */}
          {Array.isArray(task.messages) && task.messages.length > 0 && (
            <section>
              <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-3">
                Histórico do agente ({task.messages.length} mensagens)
              </p>
              <div className="space-y-2">
                {task.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-4 py-3 text-xs leading-relaxed ${
                      m.role === "assistant"
                        ? "bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#F5F5F5]/60 ml-0 mr-8"
                        : "bg-white/3 border border-white/5 text-[#F5F5F5]/30 ml-8 mr-0"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[10px] uppercase tracking-wider">
                        {m.role === "assistant" ? task.agents?.name ?? "Agente" : "Sistema"}
                      </span>
                      {m.ts && (
                        <span className="text-[#F5F5F5]/20 text-[10px]">
                          {format(new Date(m.ts), "HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
