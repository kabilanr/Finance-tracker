import Link from "next/link";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { SummaryCards } from "@/components/SummaryCards";
import { budgetAlerts } from "@/lib/budgets";
import { verifySession } from "@/lib/dal";
import { currentMonth, formatDate, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getTotals, listTransactions } from "@/lib/transactions";

export default async function Dashboard() {
  const { userId } = await verifySession();
  const month = currentMonth();
  const [totals, recent, alerts] = await Promise.all([
    getTotals(userId, { month }),
    listTransactions(userId, {}, 5),
    budgetAlerts(userId, month),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">{formatMonth(month)}</p>
      </div>

      <BudgetAlerts alerts={alerts} />

      <SummaryCards {...totals} labels={["Income this month", "Expenses this month", "Balance this month"]} />

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
