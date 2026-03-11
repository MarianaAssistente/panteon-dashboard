interface StatusBadgeProps {
  status: string;
  type?: "task" | "delivery";
}

const taskConfig: Record<string, { label: string; cls: string }> = {
  backlog:     { label: "Backlog",      cls: "bg-white/5 text-white/40 border-white/10" },
  in_progress: { label: "Em Progresso", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  review:      { label: "Review",       cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  done:        { label: "Concluído",    cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  blocked:     { label: "Bloqueado",    cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const deliveryConfig: Record<string, { label: string; cls: string }> = {
  pending_approval: { label: "Pendente", cls: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  approved:         { label: "Aprovado", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected:         { label: "Rejeitado", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StatusBadge({ status, type = "task" }: StatusBadgeProps) {
  const map = type === "delivery" ? deliveryConfig : taskConfig;
  const cfg = map[status] ?? { label: status, cls: "bg-white/5 text-white/40 border-white/10" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
