import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBadge } from "@/components/CategoryBadge";
import { RecurringRowActions } from "@/components/RecurringRowActions";
import { verifySession } from "@/lib/dal";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listRules } from "@/lib/recurring";

export const metadata: Metadata = { title: "Recurring · Finance Tracker" };

const FREQUENCY_LABEL = { weekly: "Every week", monthly: "Every month", yearly: "Every year" } as const;

export default async function RecurringPage() {
  const { userId } = await verifySession();
  const rules = await listRules(userId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recurring</h1>
          <p className="text-sm text-slate-500">
            Entries like rent, salary and subscriptions that are added automatically.
          </p>
        </div>
        <Link
          href="/recurring/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add recurring item
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          Nothing repeats yet.{" "}
          <Link href="/recurring/new" className="font-medium text-emerald-600 hover:underline">
            Add your rent, salary or a subscription
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rules.map((r) => (
            <li
              key={r.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${r.active ? "" : "opacity-60"}`}
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {r.description}
                  {!r.active && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-normal dark:bg-slate-800">
                      Paused
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
                  <span>{FREQUENCY_LABEL[r.frequency]}</span>
                  <span>·</span>
                  <span>{r.accountName}</span>
                  <span>·</span>
                  <CategoryBadge name={r.categoryName} color={r.categoryColor} />
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {!r.active ? "Paused" : r.next ? `Next on ${formatDate(r.next)}` : "Finished"}
                  {r.endDate && ` · ends ${formatDate(r.endDate)}`}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`font-medium tabular-nums ${r.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                >
                  {r.type === "income" ? "+" : "−"}
                  {formatMoney(r.amount)}
                </span>
                <RecurringRowActions id={r.id} active={r.active} description={r.description} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
