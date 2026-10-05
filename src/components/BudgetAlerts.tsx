import Link from "next/link";
import type { BudgetRow } from "@/lib/budgets";
import { formatMoney } from "@/lib/money";

export function BudgetAlerts({ alerts, showLink = true }: { alerts: BudgetRow[]; showLink?: boolean }) {
  if (alerts.length === 0) return null;
  const over = alerts.filter((a) => a.status === "over");
  const near = alerts.filter((a) => a.status === "warning");
  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 text-sm ${
        over.length
          ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
      }`}
    >
      <div className="mb-1 font-semibold">Budget alerts this month</div>
      <ul className="space-y-0.5">
        {over.map((a) => (
          <li key={a.id}>
            <strong>{a.categoryName}</strong> is over budget by {formatMoney(a.spent - a.limit)}.
          </li>
        ))}
        {near.map((a) => (
          <li key={a.id}>
            <strong>{a.categoryName}</strong> has used {Math.round(a.ratio * 100)}% of its budget ({formatMoney(a.remaining)} left).
          </li>
        ))}
      </ul>
      {showLink && (
        <Link href="/budgets" className="mt-2 inline-block font-medium underline">
          Review budgets
        </Link>
      )}
    </div>
  );
}
