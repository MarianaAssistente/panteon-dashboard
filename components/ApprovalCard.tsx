"use client";

import { useState, useTransition } from "react";
import { Task } from "@/lib/supabase";
import { approveTask, adjustTask, rejectTask } from "@/app/approvals/actions";

interface ApprovalCardProps {
  task: Task;
}

function DeliverablePreview({ url, type }: { url: string; type: string }) {
  if (!url) return null;

  if (type === "video") {
    // Try to detect YouTube
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    if (isYoutube) {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match?.[1];
      if (videoId) {
        return (
          <div className="rounded-lg overflow-hidden aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        );
      }
    }
    return (
      <video controls className="w-full rounded-lg max-h-64 bg-black" src={url}>
        Seu browser não suporta vídeo.
      </video>
    );
  }

  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Preview do entregável"
        className="rounded-lg max-h-64 w-full object-contain bg-[#0A0A0A]"
      />
    );
  }

  if (type === "text") {
    return (
      <div className="bg-[#0A0A0A] rounded-lg p-4 text-sm text-[#F5F5F5]/70 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-white/5">
        {url}
      </div>
    );
  }

  // document | link | fallback
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg p-3 border border-white/5 hover:border-[#D4AF37]/20 transition-colors text-sm text-[#D4AF37]/70 hover:text-[#D4AF37]"
    >
      {type === "document" ? "📄" : "🔗"}
      <span className="truncate">{url}</span>
      <span className="ml-auto shrink-0 text-xs">→ Abrir</span>
    </a>
  );
}

const PRIORITY_LABEL: Record<number, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const VERTICAL_COLORS: Record<string, string> = {
  "STM Capital": "text-blue-400",
  "STM Digital": "text-purple-400",
  "STM Consultancy": "text-orange-400",
  "STM Health": "text-green-400",
  "AgiSales": "text-cyan-400",
  "Interno": "text-[#D4AF37]",
};

export default function ApprovalCard({ task }: ApprovalCardProps) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState<"adjust" | "reject" | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveTask(task.id, feedback);
      setDone(true);
    });
  };

  const handleAdjust = () => {
    if (!showFeedback) { setShowFeedback("adjust"); return; }
    startTransition(async () => {
      await adjustTask(task.id, feedback);
      setDone(true);
    });
  };

  const handleReject = () => {
    if (!showFeedback) { setShowFeedback("reject"); return; }
    startTransition(async () => {
      await rejectTask(task.id, feedback);
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="bg-[#141414] border border-[#D4AF37]/10 rounded-xl p-6 flex items-center justify-center gap-2 text-[#F5F5F5]/30 text-sm">
        <span>✓</span> Resposta enviada
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/25 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[#F5F5F5] font-semibold text-sm leading-snug">{task.title}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
              {task.agents && (
                <span className="text-[#D4AF37]/60">@{task.agents.name} · {task.agents.role}</span>
              )}
              {task.vertical && (
                <span className={VERTICAL_COLORS[task.vertical] ?? "text-white/40"}>
                  {task.vertical}
                </span>
              )}
              <span className="text-[#F5F5F5]/30">Prioridade {PRIORITY_LABEL[task.priority]}</span>
              {task.execution_time_minutes && (
                <span className="text-[#F5F5F5]/25">⏱ {task.execution_time_minutes} min</span>
              )}
            </div>
          </div>
          <span className="shrink-0 bg-[#D4AF37]/10 text-[#D4AF37] text-xs px-2 py-0.5 rounded border border-[#D4AF37]/20">
            Aguardando OK
          </span>
        </div>

        {task.description && (
          <p className="text-[#F5F5F5]/40 text-xs mt-3 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Deliverable preview */}
      {task.deliverable_url && (
        <div className="p-4 border-b border-white/5">
          <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-2">Entregável</p>
          <DeliverablePreview url={task.deliverable_url} type={task.deliverable_type ?? "link"} />
        </div>
      )}

      {/* Agent message history (last 3) */}
      {Array.isArray(task.messages) && task.messages.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <p className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider mb-2">Histórico do agente</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {task.messages.slice(-3).map((m, i) => (
              <div key={i} className={`text-xs rounded-lg px-3 py-2 ${
                m.role === "assistant"
                  ? "bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#F5F5F5]/60"
                  : "bg-white/3 border border-white/5 text-[#F5F5F5]/30"
              }`}>
                <span className="font-medium mr-2 text-[10px] uppercase tracking-wider">
                  {m.role === "assistant" ? task.agents?.name ?? "Agente" : "Sistema"}
                </span>
                {m.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback field */}
      {showFeedback && (
        <div className="p-4 border-b border-white/5">
          <label className="text-[#F5F5F5]/30 text-xs uppercase tracking-wider block mb-2">
            {showFeedback === "adjust" ? "Instruções de ajuste" : "Motivo da rejeição"}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              showFeedback === "adjust"
                ? "Ex: Ajuste o tom para mais formal, reduza para 300 palavras..."
                : "Ex: O entregável não atende os requisitos porque..."
            }
            rows={3}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5]/70 placeholder:text-[#F5F5F5]/20 focus:outline-none focus:border-[#D4AF37]/30 resize-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={pending}
          className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-40"
        >
          ✅ Aprovar
        </button>
        <button
          onClick={handleAdjust}
          disabled={pending}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
            showFeedback === "adjust"
              ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
              : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
          }`}
        >
          {showFeedback === "adjust" ? "↩ Confirmar ajuste" : "🔄 Ajustar"}
        </button>
        <button
          onClick={handleReject}
          disabled={pending}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
            showFeedback === "reject"
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
          }`}
        >
          {showFeedback === "reject" ? "↩ Confirmar rejeição" : "❌ Rejeitar"}
        </button>
      </div>

      {pending && (
        <div className="px-4 pb-3 text-center text-xs text-[#F5F5F5]/30">Processando...</div>
      )}
    </div>
  );
}
