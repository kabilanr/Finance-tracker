import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { currentMonth, formatMonth, shiftMonth, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Export · Finance Tracker" };

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950";
const buttonClass =
  "rounded-md border border-slate-300 px-4 py-2 text-sm hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:hover:text-emerald-400";

export default async function ExportPage() {
  await verifySession();
  const month = currentMonth();
  const lastMonth = shiftMonth(month, -1);
  const year = month.slice(0, 4);
  const presets = [
    { label: `This month (${formatMonth(month)})`, query: `month=${month}` },
    { label: `Last month (${formatMonth(lastMonth)})`, query: `month=${lastMonth}` },
    { label: `This year (${year})`, query: `from=${year}-01-01&to=${year}-12-31` },
    { label: "Everything", query: "" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Export</h1>
        <p className="text-sm text-slate-500">
          Download your data as a CSV file that opens in Excel, Google Sheets or Numbers.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Quick download</h2>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <a key={p.label} href={`/export/csv?${p.query}`} download className={buttonClass}>
              {p.label}
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Custom export</h2>
        <form action="/export/csv" method="get" className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              From
              <input type="date" name="from" defaultValue={`${year}-01-01`} className={inputClass} />
            </label>
            <label className="block text-sm">
              To
              <input type="date" name="to" defaultValue={today()} className={inputClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              What
              <select name="what" defaultValue="transactions" className={inputClass}>
                <option value="transactions">Income and expenses</option>
                <option value="transfers">Transfers between accounts</option>
              </select>
            </label>
            <label className="block text-sm">
              Type
              <select name="type" defaultValue="" className={inputClass}>
                <option value="">Income and expenses</option>
                <option value="income">Income only</option>
                <option value="expense">Expenses only</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Download CSV
          </button>
        </form>
        <p className="text-xs text-slate-500">
          Tip: the Transactions page also has an Export button that downloads exactly what its filters show.
        </p>
      </section>
    </div>
  );
}
