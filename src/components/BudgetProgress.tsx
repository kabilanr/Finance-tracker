import type { BudgetStatus } from "@/lib/budgets";
import { formatMoney } from "@/lib/money";

const barColor: Record<BudgetStatus, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  over: "bg-red-600",
};

export function BudgetProgress({
  spent,
  limit,
  ratio,
  status,
}: {
  spent: number;
  limit: number;
  ratio: number;
  status: BudgetStatus;
}) {
  const remaining = limit - spent;
  return (
    <div className="space-y-1">
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${barColor[status]}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 tabular-nums">
        <span>
          {formatMoney(spent)} of {formatMoney(limit)}
        </span>
        <span className={status === "over" ? "font-medium text-red-600" : status === "warning" ? "text-amber-600" : ""}>
          {remaining >= 0 ? `${formatMoney(remaining)} left` : `${formatMoney(-remaining)} over`}
        </span>
      </div>
    </div>
  );
}
