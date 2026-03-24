import { Agent } from "@/lib/supabase";

interface AgentCardProps {
  agent: Agent;
  lastTask?: string;
  pendingCount?: number;
}

const statusConfig = {
  working:  { emoji: "🟢", label: "Ativo",        ring: "ring-green-400/20",   border: "border-green-400/20",  dotColor: "#22c55e" },
  idle:     { emoji: "🟡", label: "Ocioso",       ring: "ring-amber-400/20",   border: "border-amber-400/20",  dotColor: "#f59e0b" },
  standby:  { emoji: "⚫", label: "Standby",      ring: "ring-gray-500/10",    border: "border-[#D4AF37]/15",  dotColor: "#6b7280" },
  blocked:  { emoji: "🔴", label: "Bloqueado",    ring: "ring-red-500/20",     border: "border-red-500/20",    dotColor: "#ef4444" },
};

const INITIALS: Record<string, string> = {
  mariana: "MA", atena: "AT", hefesto: "HF", apollo: "AP",
  afrodite: "AF", hera: "HR", ares: "AR", hestia: "HS",
};

export default function AgentCard({ agent, lastTask, pendingCount = 0 }: AgentCardProps) {
  const sc = statusConfig[agent.status] ?? statusConfig.idle;
  const initials = INITIALS[agent.id] ?? agent.name.slice(0, 2).toUpperCase();

  return (
    <div
      className={`group relative bg-[#141414] border ${sc.border} rounded-xl p-4
        hover:border-[#D4AF37]/40 hover:bg-[#181818] transition-all duration-200 ring-1 ${sc.ring}`}
    >
      {/* Approval badge */}
      {pendingCount > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-10">
          {pendingCount}
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-sm font-semibold">
          {initials}
        </div>
        <span title={sc.label} className="text-lg leading-none">{sc.emoji}</span>
      </div>

      {/* Name & Role */}
      <p className="text-[#F5F5F5] font-semibold text-sm">{agent.name}</p>
      <p className="text-[#F5F5F5]/40 text-xs">{agent.role}</p>

      {/* Status label */}
      <p className="text-xs mt-1 font-medium" style={{ color: sc.dotColor }}>
        {sc.label}
      </p>

      {/* Model chip */}
      <div className="mt-2 mb-2">
        <span className="text-[10px] bg-[#D4AF37]/5 text-[#D4AF37]/50 border border-[#D4AF37]/10 px-2 py-0.5 rounded font-mono">
          {agent.model}
        </span>
      </div>

      {/* Last task */}
      <div className="border-t border-white/5 pt-2 mt-1">
        <p className="text-[#F5F5F5]/25 text-[11px] truncate italic">
          {lastTask ?? "Sem tarefas recentes"}
        </p>
      </div>
    </div>
  );
}
