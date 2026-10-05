import { formatMoney } from "@/lib/money";

export function SummaryCards({
  income,
  expense,
  balance,
  labels = ["Income", "Expenses", "Balance"],
}: {
  income: number;
  expense: number;
  balance: number;
  labels?: [string, string, string];
}) {
  const cards = [
    { label: labels[0], value: income, color: "text-emerald-600" },
    { label: labels[1], value: expense, color: "text-red-600" },
    { label: labels[2], value: balance, color: balance < 0 ? "text-red-600" : "" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="text-sm text-slate-500">{card.label}</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${card.color}`}>{formatMoney(card.value)}</div>
        </div>
      ))}
    </div>
  );
}
