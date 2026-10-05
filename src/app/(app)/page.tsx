const summary = [
  { label: "Income this month", value: "—" },
  { label: "Expenses this month", value: "—" },
  { label: "Balance", value: "—" },
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-1 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Numbers appear here once the Transactions module is added.
      </p>
    </div>
  );
}
