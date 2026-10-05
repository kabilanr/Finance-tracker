"use client";

import { useState } from "react";
import { formatMonth as fullMonth, formatMonthShort as monthLabel } from "@/lib/dates";
import { formatCompact, formatMoney } from "@/lib/money";
import { useWidth } from "./useWidth";

export type MonthPoint = { month: string; income: number; expense: number };

const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 56 };

function niceStep(max: number, ticks = 4) {
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

// Column with a 4px rounded top and a square base on the baseline.
function columnPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const SERIES = [
  { key: "income", label: "Income", color: "var(--series-income)" },
  { key: "expense", label: "Expenses", color: "var(--series-expense)" },
] as const;

export function IncomeExpenseChart({ data }: { data: MonthPoint[] }) {
  const [ref, measured] = useWidth<HTMLDivElement>();
  const width = measured ?? 0;
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = plotW / data.length;
  // Two columns per month separated by a 2px gap, capped at 24px each.
  const barW = Math.max(2, Math.min(24, (band * 0.72 - 2) / 2));
  const y = (v: number) => MARGIN.top + plotH - (v / top) * plotH;
  const labelEvery = band < 34 ? 2 : 1;

  const hovered = active === null ? null : data[active];
  // Sit the tooltip beside the hovered month (never on top of its columns),
  // flipping to the left side in the right half of the chart.
  const TOOLTIP_W = 176;
  const tooltipLeft =
    active === null
      ? 0
      : active < data.length / 2
        ? Math.min(MARGIN.left + band * (active + 1) + 4, width - TOOLTIP_W)
        : Math.max(MARGIN.left + band * active - TOOLTIP_W - 4, 0);

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-slate-600 dark:text-slate-400">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={ref} className="relative" style={{ height: HEIGHT }} onPointerLeave={() => setActive(null)}>
        {measured !== null && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Income and expenses by month">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--chart-text)"
                  className="tabular-nums"
                >
                  ₹{formatCompact(t)}
                </text>
              </g>
            ))}

            {data.map((d, i) => {
              const cx = MARGIN.left + band * (i + 0.5);
              const showLabel = (data.length - 1 - i) % labelEvery === 0;
              const withYear = i === 0 || d.month.endsWith("-01");
              return (
                <g key={d.month}>
                  {active === i && (
                    <rect
                      x={MARGIN.left + band * i}
                      y={MARGIN.top}
                      width={band}
                      height={plotH}
                      fill="var(--chart-grid)"
                      opacity={0.5}
                    />
                  )}
                  <path
                    d={columnPath(cx - barW - 1, y(d.income), barW, y(0) - y(d.income))}
                    fill="var(--series-income)"
                  />
                  <path d={columnPath(cx + 1, y(d.expense), barW, y(0) - y(d.expense))} fill="var(--series-expense)" />
                  {showLabel && (
                    <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--chart-text)">
                      {monthLabel(d.month, withYear)}
                    </text>
                  )}
                  <rect
                    x={MARGIN.left + band * i}
                    y={MARGIN.top}
                    width={band}
                    height={plotH + MARGIN.bottom}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${fullMonth(d.month)}: income ${formatMoney(d.income)}, expenses ${formatMoney(d.expense)}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="outline-none"
                  />
                </g>
              );
            })}
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(0)}
              y2={y(0)}
              stroke="var(--chart-text)"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          </svg>
        )}

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900"
            style={{ left: tooltipLeft }}
          >
            <div className="mb-1.5 text-slate-500">{fullMonth(hovered.month)}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="h-0.5 w-3 rounded" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums">{formatMoney(hovered[s.key])}</span>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
              <span className="text-slate-500">Net</span>
              <span className="font-semibold tabular-nums">{formatMoney(hovered.income - hovered.expense)}</span>
            </div>
          </div>
        )}
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs text-slate-500">Show as table</summary>
        <table className="mt-2 w-full text-xs">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Income</th>
              <th className="py-1 text-right font-medium">Expenses</th>
              <th className="py-1 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.month} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1">{fullMonth(d.month)}</td>
                <td className="py-1 text-right">{formatMoney(d.income)}</td>
                <td className="py-1 text-right">{formatMoney(d.expense)}</td>
                <td className="py-1 text-right">{formatMoney(d.income - d.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
