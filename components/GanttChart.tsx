"use client";

import { useState, useMemo } from "react";

export interface Milestone {
  id: string;
  name: string;
  status: string;
  baseline_start?: string | null;
  baseline_end?: string | null;
  forecast_start?: string | null;
  forecast_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  depends_on?: string[];
  order_index: number;
}

interface TooltipData {
  x: number;
  y: number;
  milestone: Milestone;
}

const STATUS_COLORS: Record<string, string> = {
  done:        "#4ADE80",
  in_progress: "#D4AF37",
  delayed:     "#F87171",
  pending:     "#71717A",
};

const STATUS_LABELS: Record<string, string> = {
  done:        "Concluído",
  in_progress: "Em Andamento",
  delayed:     "Atrasado",
  pending:     "Pendente",
};

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}

function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function GanttChart({ milestones }: { milestones: Milestone[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const sorted = useMemo(
    () => [...milestones].sort((a, b) => a.order_index - b.order_index),
    [milestones]
  );

  // Compute timeline bounds from all dates
  const allDates = useMemo(() => {
    const dates: Date[] = [];
    for (const m of sorted) {
      [m.baseline_start, m.baseline_end, m.forecast_start, m.forecast_end, m.actual_start, m.actual_end]
        .forEach(d => { const pd = parseDate(d); if (pd) dates.push(pd); });
    }
    return dates;
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 border border-dashed border-[#D4AF37]/15 rounded-xl">
        <p className="text-[#F5F5F5]/30 text-sm">
          Nenhum milestone cadastrado — execute a migration SQL e insira dados no Supabase
        </p>
      </div>
    );
  }

  const minDate = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : new Date();
  const maxDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date(minDate.getTime() + 90 * 86400000);

  // Padding: 7 days each side
  const padMs = 7 * 86400000;
  const chartStart = new Date(minDate.getTime() - padMs);
  const chartEnd   = new Date(maxDate.getTime() + padMs);
  const totalMs    = chartEnd.getTime() - chartStart.getTime();

  const LABEL_WIDTH = 200;
  const CHART_WIDTH = 700;
  const ROW_HEIGHT  = 40;
  const BAR_HEIGHT  = 10;
  const HEADER_H    = 32;
  const totalWidth  = LABEL_WIDTH + CHART_WIDTH;
  const totalHeight = HEADER_H + sorted.length * ROW_HEIGHT + 16;

  function xPos(date: Date): number {
    return LABEL_WIDTH + ((date.getTime() - chartStart.getTime()) / totalMs) * CHART_WIDTH;
  }

  function barWidth(start: Date, end: Date): number {
    const w = ((end.getTime() - start.getTime()) / totalMs) * CHART_WIDTH;
    return Math.max(w, 4);
  }

  // Generate month ticks
  const monthTicks: { x: number; label: string }[] = [];
  const cur = new Date(Date.UTC(chartStart.getUTCFullYear(), chartStart.getUTCMonth(), 1));
  while (cur <= chartEnd) {
    const x = xPos(cur);
    if (x >= LABEL_WIDTH && x <= totalWidth) {
      monthTicks.push({
        x,
        label: cur.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
      });
    }
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }

  // Today line
  const todayX = xPos(new Date());

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-3 flex items-center gap-4 text-[11px] text-[#F5F5F5]/40">
        <span className="flex items-center gap-1.5"><span className="w-8 h-1.5 rounded bg-[#71717A]" /> Baseline</span>
        <span className="flex items-center gap-1.5"><span className="w-8 h-2 rounded bg-[#D4AF37]" /> Forecast</span>
        <span className="flex items-center gap-1.5"><span className="w-8 h-2 rounded bg-[#4ADE80]" /> Realizado</span>
      </div>

      <svg
        width={totalWidth}
        height={totalHeight}
        className="font-sans select-none"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Background */}
        <rect width={totalWidth} height={totalHeight} fill="#0D0D0D" rx={8} />

        {/* Header row */}
        <rect x={0} y={0} width={totalWidth} height={HEADER_H} fill="#111" rx={8} />
        <rect x={0} y={HEADER_H - 8} width={totalWidth} height={8} fill="#111" />

        {/* Month labels */}
        {monthTicks.map(t => (
          <g key={t.x}>
            <line x1={t.x} y1={HEADER_H} x2={t.x} y2={totalHeight} stroke="#D4AF3715" strokeWidth={1} />
            <text x={t.x + 4} y={HEADER_H - 8} fontSize={10} fill="#D4AF3780">{t.label}</text>
          </g>
        ))}

        {/* Today line */}
        {todayX >= LABEL_WIDTH && todayX <= totalWidth && (
          <>
            <line x1={todayX} y1={HEADER_H} x2={todayX} y2={totalHeight} stroke="#F87171" strokeWidth={1.5} strokeDasharray="4,3" />
            <text x={todayX + 3} y={HEADER_H + 12} fontSize={9} fill="#F87171">hoje</text>
          </>
        )}

        {/* Rows */}
        {sorted.map((m, i) => {
          const y = HEADER_H + i * ROW_HEIGHT;
          const rowColor = i % 2 === 0 ? "#FFFFFF05" : "#00000000";

          const bs = parseDate(m.baseline_start);
          const be = parseDate(m.baseline_end);
          const fs = parseDate(m.forecast_start);
          const fe = parseDate(m.forecast_end);
          const as_ = parseDate(m.actual_start);
          const ae  = parseDate(m.actual_end);
          const statusColor = STATUS_COLORS[m.status] ?? "#71717A";

          return (
            <g key={m.id}>
              {/* Row background */}
              <rect x={0} y={y} width={totalWidth} height={ROW_HEIGHT} fill={rowColor} />

              {/* Status dot + label */}
              <circle cx={12} cy={y + ROW_HEIGHT / 2} r={4} fill={statusColor} />
              <text
                x={22} y={y + ROW_HEIGHT / 2 + 4}
                fontSize={11} fill="#F5F5F5CC"
                clipPath={`url(#clip-label-${i})`}
              >
                {m.name}
              </text>
              <clipPath id={`clip-label-${i}`}>
                <rect x={22} y={y} width={LABEL_WIDTH - 26} height={ROW_HEIGHT} />
              </clipPath>

              {/* Divider */}
              <line x1={LABEL_WIDTH} y1={y} x2={LABEL_WIDTH} y2={y + ROW_HEIGHT} stroke="#D4AF3720" strokeWidth={1} />

              {/* Baseline bar (thin, gray) */}
              {bs && be && (
                <rect
                  x={xPos(bs)} y={y + ROW_HEIGHT / 2 - 2}
                  width={barWidth(bs, be)} height={4}
                  rx={2} fill="#4B5563"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, milestone: m })}
                />
              )}

              {/* Forecast bar (gold) */}
              {fs && fe && (
                <rect
                  x={xPos(fs)} y={y + ROW_HEIGHT / 2 - BAR_HEIGHT / 2}
                  width={barWidth(fs, fe)} height={BAR_HEIGHT}
                  rx={3}
                  fill={`${statusColor}CC`}
                  stroke={statusColor}
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, milestone: m })}
                />
              )}

              {/* Actual bar (green, if present) */}
              {as_ && ae && (
                <rect
                  x={xPos(as_)} y={y + ROW_HEIGHT / 2 - BAR_HEIGHT / 2 - 1}
                  width={barWidth(as_, ae)} height={BAR_HEIGHT + 2}
                  rx={3} fill="#4ADE8040" stroke="#4ADE80" strokeWidth={1.5}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, milestone: m })}
                />
              )}

              {/* Diamond for milestones without duration (start==end) */}
              {fs && fe && fs.getTime() === fe.getTime() && (
                <polygon
                  points={`${xPos(fs)},${y + ROW_HEIGHT / 2 - 7} ${xPos(fs) + 7},${y + ROW_HEIGHT / 2} ${xPos(fs)},${y + ROW_HEIGHT / 2 + 7} ${xPos(fs) - 7},${y + ROW_HEIGHT / 2}`}
                  fill={statusColor}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, milestone: m })}
                />
              )}

              {/* Row separator */}
              <line x1={0} y1={y + ROW_HEIGHT} x2={totalWidth} y2={y + ROW_HEIGHT} stroke="#D4AF3710" strokeWidth={1} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-[#1A1A1A] border border-[#D4AF37]/25 rounded-xl p-3 shadow-xl text-xs pointer-events-none max-w-[240px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-[#F5F5F5] mb-2">{tooltip.milestone.name}</p>
          <p className="mb-1">
            <span className="text-[#D4AF37]/60">Status: </span>
            <span style={{ color: STATUS_COLORS[tooltip.milestone.status] }}>
              {STATUS_LABELS[tooltip.milestone.status] ?? tooltip.milestone.status}
            </span>
          </p>
          {tooltip.milestone.baseline_start && (
            <p className="text-[#F5F5F5]/50">
              Baseline: {formatDateBR(parseDate(tooltip.milestone.baseline_start)!)}
              {tooltip.milestone.baseline_end && ` → ${formatDateBR(parseDate(tooltip.milestone.baseline_end)!)}`}
            </p>
          )}
          {tooltip.milestone.forecast_start && (
            <p className="text-[#F5F5F5]/50">
              Forecast: {formatDateBR(parseDate(tooltip.milestone.forecast_start)!)}
              {tooltip.milestone.forecast_end && ` → ${formatDateBR(parseDate(tooltip.milestone.forecast_end)!)}`}
            </p>
          )}
          {tooltip.milestone.actual_start && (
            <p className="text-[#4ADE80]/80">
              Realizado: {formatDateBR(parseDate(tooltip.milestone.actual_start)!)}
              {tooltip.milestone.actual_end && ` → ${formatDateBR(parseDate(tooltip.milestone.actual_end)!)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
