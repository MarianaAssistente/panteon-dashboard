import { Delivery } from "@/lib/supabase";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineProps {
  deliveries: Delivery[];
}

function groupByDate(deliveries: Delivery[]) {
  const groups: Record<string, Delivery[]> = {};
  for (const d of deliveries) {
    const key = d.created_at.split("T")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }
  return groups;
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "EEEE, d 'de' MMM", { locale: ptBR });
}

const statusStyles: Record<string, string> = {
  approved:        "bg-green-500",
  rejected:        "bg-red-500",
  pending_approval: "bg-[#D4AF37]",
};

export default function Timeline({ deliveries }: TimelineProps) {
  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12 text-[#F5F5F5]/20 text-sm bg-[#141414] rounded-xl border border-[#D4AF37]/10">
        Nenhuma entrega no período selecionado.
      </div>
    );
  }

  const groups = groupByDate(deliveries);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D4AF37]/10" />

      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date}>
            {/* Date label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 shrink-0" />
              <p className="text-[#D4AF37]/70 text-xs font-semibold uppercase tracking-wider capitalize">
                {dateLabel(date)}
              </p>
            </div>

            {/* Entries */}
            <div className="ml-7 space-y-3">
              {groups[date].map((d) => (
                <div
                  key={d.id}
                  className="relative bg-[#141414] border border-[#D4AF37]/10 rounded-xl p-4 hover:border-[#D4AF37]/25 transition-colors"
                >
                  {/* Connector dot */}
                  <div
                    className={`absolute -left-[25px] top-5 w-2 h-2 rounded-full ${
                      statusStyles[d.status] ?? "bg-gray-500"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[#F5F5F5] text-sm font-medium">{d.title}</p>
                      {d.description && (
                        <p className="text-[#F5F5F5]/40 text-xs mt-1 line-clamp-2">{d.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                        {d.agents && (
                          <span className="text-[#D4AF37]/60">@{d.agents.name}</span>
                        )}
                        {d.tasks && (
                          <span className="text-[#F5F5F5]/25 truncate">{d.tasks.title}</span>
                        )}
                        <span className="text-[#F5F5F5]/20 ml-auto">
                          {format(new Date(d.created_at), "HH:mm")}
                        </span>
                      </div>
                    </div>

                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${
                      d.status === "approved"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : d.status === "rejected"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20"
                    }`}>
                      {d.status === "approved" ? "Aprovado" : d.status === "rejected" ? "Rejeitado" : "Pendente"}
                    </span>
                  </div>

                  {d.drive_url && (
                    <a
                      href={d.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors"
                    >
                      📁 Ver entregável
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
