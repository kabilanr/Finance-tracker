import type { Metadata } from "next";
import Link from "next/link";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { AddBudgetForm, BudgetRowActions } from "@/components/BudgetEditor";
import { BudgetProgress } from "@/components/BudgetProgress";
import { listBudgetsForMonth } from "@/lib/budgets";
import { listCategories } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { currentMonth, formatMonth, isMonth, shiftMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Budgets · Finance Tracker" };

export default async function BudgetsPage(props: PageProps<"/budgets">) {
  const { userId } = await verifySession();
  const params = await props.searchParams;
  const monthParam = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = isMonth(monthParam) ? monthParam : currentMonth();
  const isCurrent = month === currentMonth();

  const [rows, categories] = await Promise.all([listBudgetsForMonth(userId, month), listCategories(userId)]);
  const budgeted = new Set(rows.map((r) => r.categoryId));
  const available = categories.filter((c) => c.type === "expense" && !budgeted.has(c.id));
  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const nav = "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <p className="text-sm text-slate-500">
          Monthly spending limits per expense category. You&apos;ll see an alert at 80% and when you go over.
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Link href={`/budgets?month=${shiftMonth(month, -1)}`} className={nav} aria-label="Previous month">
          ‹
        </Link>
        <span className="min-w-36 text-center text-sm font-medium">{formatMonth(month)}</span>
        <Link href={`/budgets?month=${shiftMonth(month, 1)}`} className={nav} aria-label="Next month">
          ›
        </Link>
        {!isCurrent && (
          <Link href="/budgets" className={nav}>
            This month
          </Link>
        )}
      </div>

      {isCurrent && <BudgetAlerts alerts={rows.filter((r) => r.status !== "ok")} showLink={false} />}

      {rows.length > 0 && (
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
          <div className="mb-2 text-sm text-slate-500">All budgets</div>
          <BudgetProgress
            spent={totalSpent}
            limit={totalLimit}
            ratio={totalLimit ? totalSpent / totalLimit : 0}
            status={totalSpent > totalLimit ? "over" : totalSpent >= totalLimit * 0.8 ? "warning" : "ok"}
          />
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No budgets yet. Add one below.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rows.map((b) => (
            <li key={b.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/transactions?month=${month}&type=expense&category=${b.categoryId}`}
                  className="flex items-center gap-2 font-medium hover:underline"
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                  {b.categoryName}
                  <span className="text-xs font-normal text-slate-500">{formatMoney(b.limit)} / month</span>
                </Link>
                <BudgetRowActions id={b.id} categoryId={b.categoryId} limit={b.limit} />
              </div>
              <BudgetProgress spent={b.spent} limit={b.limit} ratio={b.ratio} status={b.status} />
            </li>
          ))}
        </ul>
      )}

      <AddBudgetForm categories={available} />
    </div>
  );
}
