export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 p-6 shadow-sm dark:border-slate-800">
        <div className="mb-6 text-center text-lg font-semibold text-emerald-600">Finance Tracker</div>
        {children}
      </div>
    </div>
  );
}
