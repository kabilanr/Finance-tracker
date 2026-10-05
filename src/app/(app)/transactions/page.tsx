import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { CategoryBadge } from "@/components/CategoryBadge";
import { DeleteTransactionButton } from "@/components/DeleteTransactionButton";
import { SelectFilter } from "@/components/SelectFilter";
import { SummaryCards } from "@/components/SummaryCards";
import type { TransactionType } from "@/db/schema";
import { listAccounts } from "@/lib/accounts";
import { listCategories } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { currentMonth, formatDate, formatMonth, isMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isUuid } from "@/lib/transaction-schema";
import { getTotals, listTransactions } from "@/lib/transactions";

export const metadata: Metadata = { title: "Transactions · Finance Tracker" };

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const { userId } = await verifySession();
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const monthParam = one(params.month);
  const allTime = monthParam === "all";
  const month = isMonth(monthParam) ? monthParam : currentMonth();
  const typeParam = one(params.type);
  const type: TransactionType | undefined =
    typeParam === "income" || typeParam === "expense" ? typeParam : undefined;
  const q = one(params.q)?.trim() || undefined;
  const categoryParam = one(params.category);
  const category = categoryParam === "none" || (categoryParam && isUuid(categoryParam)) ? categoryParam : undefined;

  const accountParam = one(params.account);
  const account = accountParam && isUuid(accountParam) ? accountParam : undefined;

  const filters = { month: allTime ? undefined : month, type, category, account, q };
  const [rows, totals, categories, accounts] = await Promise.all([
    listTransactions(userId, filters),
    getTotals(userId, filters),
    listCategories(userId),
    listAccounts(userId),
  ]);
  const accountOptions = [
    { value: "", label: "All accounts" },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories
      .filter((c) => !type || c.type === type)
      .map((c) => ({ value: c.id, label: type ? c.name : `${c.name} (${c.type})` })),
    { value: "none", label: "Uncategorized" },
  ];

  const href = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { month: allTime ? "all" : month, type, category, account, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `/transactions?${next}`;
  };

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active
        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add transaction
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {!allTime && (
            <Link href={href({ month: shiftMonth(month, -1) })} className={tab(false)} aria-label="Previous month">
              ‹
            </Link>
          )}
          <span className="min-w-36 text-center text-sm font-medium">
            {allTime ? "All time" : formatMonth(month)}
          </span>
          {!allTime && (
            <Link href={href({ month: shiftMonth(month, 1) })} className={tab(false)} aria-label="Next month">
              ›
            </Link>
          )}
          <Link href={href({ month: allTime ? currentMonth() : "all" })} className={tab(allTime)}>
            All time
          </Link>
        </div>

        <div className="flex gap-1">
          <Link href={href({ type: undefined })} className={tab(!type)}>All</Link>
          <Link href={href({ type: "income", category: undefined })} className={tab(type === "income")}>Income</Link>
          <Link href={href({ type: "expense", category: undefined })} className={tab(type === "expense")}>Expenses</Link>
        </div>

        <SelectFilter param="category" value={category ?? ""} options={categoryOptions} label="Category" />
        {accounts.length > 1 && (
          <SelectFilter param="account" value={account ?? ""} options={accountOptions} label="Account" />
        )}

        <Form action="/transactions" className="flex flex-1 gap-2 sm:max-w-xs">
          <input type="hidden" name="month" value={allTime ? "all" : month} />
          {type && <input type="hidden" name="type" value={type} />}
          {category && <input type="hidden" name="category" value={category} />}
          {account && <input type="hidden" name="account" value={account} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search"
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700"
          />
        </Form>
      </div>

      <SummaryCards {...totals} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No transactions here yet.{" "}
          <Link href="/transactions/new" className="font-medium text-emerald-600 hover:underline">
            Add one
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatDate(t.date)}</td>
                  <td className="px-4 py-2">
                    <div>{t.description}</div>
                    <div className="text-xs text-slate-500">
                      {t.accountName}
                      {t.note && ` · ${t.note}`}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600 dark:text-slate-400">
                    <CategoryBadge name={t.categoryName} color={t.categoryColor} />
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2 text-right font-medium tabular-nums ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Link href={`/transactions/${t.id}/edit`} className="mr-3 text-slate-600 hover:underline dark:text-slate-400">
                      Edit
                    </Link>
                    <DeleteTransactionButton id={t.id} description={t.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
