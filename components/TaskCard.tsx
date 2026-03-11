import { Task } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
}

const priorityConfig = {
  1: { label: "Alta", classes: "text-red-400" },
  2: { label: "Média", classes: "text-yellow-400" },
  3: { label: "Baixa", classes: "text-green-400" },
};

const verticalColors: Record<string, string> = {
  "STM Capital": "text-blue-400",
  "STM Digital": "text-purple-400",
  "STM Consultancy": "text-orange-400",
  "STM Health": "text-green-400",
  "AgiSales": "text-cyan-400",
  "Interno": "text-[#D4AF37]",
};

export default function TaskCard({ task }: TaskCardProps) {
  const pc = priorityConfig[task.priority] ?? priorityConfig[2];
  const vc = task.vertical ? verticalColors[task.vertical] ?? "text-white/40" : "text-white/40";

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4 hover:border-[#D4AF37]/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[#F5F5F5] text-sm font-medium leading-snug flex-1">{task.title}</p>
        <StatusBadge status={task.status} type="task" />
      </div>

      {task.description && (
        <p className="text-[#F5F5F5]/40 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs flex-wrap">
        {task.vertical && (
          <span className={`${vc} font-medium`}>{task.vertical}</span>
        )}
        <span className={pc.classes}>↑ {pc.label}</span>
        {task.agents && (
          <span className="text-[#F5F5F5]/30">@{task.agents.name}</span>
        )}
        <span className="text-[#F5F5F5]/20 ml-auto">
          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </div>
  );
}
