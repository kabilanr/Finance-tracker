import Link from "next/link";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { CategoryBreakdown } from "@/components/charts/CategoryBreakdown";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { SummaryCards } from "@/components/SummaryCards";
import { budgetAlerts } from "@/lib/budgets";
import { verifySession } from "@/lib/dal";
import { currentMonth, formatDate, formatMonth, isMonth, shiftMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { monthlyTotals, spendingByCategory } from "@/lib/reports";
import { getTotals, listTransactions } from "@/lib/transactions";

const RANGES = [6, 12] as const;

export default async function Dashboard(props: PageProps<"/">) {
  const { userId } = await verifySession();
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const thisMonth = currentMonth();
  const monthParam = one(params.month);
  const month = isMonth(monthParam) ? monthParam : thisMonth;
  const range = one(params.range) === "12" ? 12 : 6;
  const isCurrent = month === thisMonth;

  const [totals, recent, alerts, trend, byCategory] = await Promise.all([
    getTotals(userId, { month }),
    listTransactions(userId, {}, 5),
    isCurrent ? budgetAlerts(userId, month) : Promise.resolve([]),
    monthlyTotals(userId, month, range),
    spendingByCategory(userId, month),
  ]);

  const href = (overrides: { month?: string; range?: number }) => {
    const next = new URLSearchParams();
    const m = overrides.month ?? month;
    const r = overrides.range ?? range;
    if (m !== thisMonth) next.set("month", m);
    if (r !== 6) next.set("range", String(r));
    const qs = next.toString();
    return qs ? `/?${qs}` : "/";
  };
  const control = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active
        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;
  const card = "rounded-lg border border-slate-200 p-4 dark:border-slate-800";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link href={href({ month: shiftMonth(month, -1) })} className={control(false)} aria-label="Previous month">
            ‹
          </Link>
          <span className="min-w-36 text-center text-sm font-medium">{formatMonth(month)}</span>
          <Link href={href({ month: shiftMonth(month, 1) })} className={control(false)} aria-label="Next month">
            ›
          </Link>
          {!isCurrent && (
            <Link href={href({ month: thisMonth })} className={control(false)}>
              This month
            </Link>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link key={r} href={href({ range: r })} className={control(range === r)}>
              {r} months
            </Link>
          ))}
        </div>
      </div>

      <BudgetAlerts alerts={alerts} />

      <SummaryCards
        {...totals}
        labels={
          isCurrent
            ? ["Income this month", "Expenses this month", "Balance this month"]
            : ["Income", "Expenses", "Balance"]
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className={`${card} lg:col-span-3`}>
          <h2 className="font-semibold">Income vs expenses</h2>
          <p className="mb-3 text-xs text-slate-500">
            Last {range} months to {formatMonth(month)}
          </p>
          <IncomeExpenseChart data={trend} />
        </section>

        <section className={`${card} lg:col-span-2`}>
          <h2 className="font-semibold">Spending by category</h2>
          <p className="mb-3 text-xs text-slate-500">{formatMonth(month)}</p>
          <CategoryBreakdown data={byCategory} month={month} />
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent transactions</h2>
          <Link href="/transactions" className="text-sm text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing yet.{" "}
            <Link href="/transactions/new" className="font-medium text-emerald-600 hover:underline">
              Add your first transaction
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div>{t.description}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(t.date)}
                    {t.categoryName && ` · ${t.categoryName}`}
                  </div>
                </div>
                <div
                  className={`font-medium tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
