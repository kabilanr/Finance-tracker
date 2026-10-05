import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { CategorySpend } from "@/lib/reports";

// Ranked horizontal bars: one series (spending), so one hue; the category's
// own colour appears only as a small identity dot beside its name.
export function CategoryBreakdown({ data, month }: { data: CategorySpend[]; month: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No spending recorded this month.</p>;
  }
  const max = data[0].total;
  const total = data.reduce((s, d) => s + d.total, 0);
  return (
    <ul className="space-y-1">
      {data.map((d) => {
        const share = total ? Math.round((d.total / total) * 100) : 0;
        const href = `/transactions?month=${month}&type=expense&category=${d.id ?? "none"}`;
        return (
          <li key={d.id ?? "none"}>
            <Link
              href={href}
              title={`${d.name}: ${formatMoney(d.total)} (${share}% of spending)`}
              className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-900 dark:focus-visible:bg-slate-900"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="h-3">
                <span
                  className="block h-full rounded-r"
                  style={{ width: `${Math.max(1, (d.total / max) * 100)}%`, backgroundColor: "var(--series-expense)" }}
                />
              </span>
              <span className="text-right tabular-nums">
                {formatMoney(d.total)} <span className="text-xs text-slate-500">{share}%</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
