interface CostWidgetProps {
  dayCost: number;
  monthCost: number;
  dayBudget?: number;
  monthBudget?: number;
}

function ProgressBar({ value, max, warn }: { value: number; max: number; warn?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const overWarn = warn && value >= warn;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-500 ${overWarn ? "bg-red-500" : "bg-[#D4AF37]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CostWidget({
  dayCost,
  monthCost,
  dayBudget = 5,
  monthBudget = 200,
}: CostWidgetProps) {
  const dayPct = (dayCost / dayBudget) * 100;
  const monthPct = (monthCost / monthBudget) * 100;

  return (
    <div className="bg-[#141414] border border-[#D4AF37]/15 rounded-xl p-4 space-y-4">
      <p className="text-[#F5F5F5]/40 text-xs font-semibold uppercase tracking-wider">Custo Estimado</p>

      {/* Day */}
      <div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-[#F5F5F5]/40">Hoje</span>
          <div className="text-right">
            <span className={`text-lg font-bold ${dayPct >= 75 ? "text-red-400" : "text-[#D4AF37]"}`}>
              ${dayCost.toFixed(2)}
            </span>
            <span className="text-[#F5F5F5]/20 text-xs ml-1">/ ${dayBudget}</span>
          </div>
        </div>
        <ProgressBar value={dayCost} max={dayBudget} warn={dayBudget * 0.75} />
        {dayPct >= 75 && (
          <p className="text-red-400 text-[10px] mt-1">⚠ {dayPct.toFixed(0)}% do limite diário</p>
        )}
      </div>

      {/* Month */}
      <div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-[#F5F5F5]/40">Este mês</span>
          <div className="text-right">
            <span className={`text-lg font-bold ${monthPct >= 75 ? "text-red-400" : "text-[#F5F5F5]"}`}>
              ${monthCost.toFixed(2)}
            </span>
            <span className="text-[#F5F5F5]/20 text-xs ml-1">/ ${monthBudget}</span>
          </div>
        </div>
        <ProgressBar value={monthCost} max={monthBudget} warn={monthBudget * 0.75} />
        {monthPct >= 75 && (
          <p className="text-red-400 text-[10px] mt-1">⚠ {monthPct.toFixed(0)}% do limite mensal</p>
        )}
      </div>
    </div>
  );
}
