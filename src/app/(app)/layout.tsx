import { Sidebar } from "@/components/Sidebar";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex flex-col border-b border-slate-200 p-4 md:w-56 md:border-b-0 md:border-r dark:border-slate-800">
        <div className="mb-4 text-lg font-semibold text-emerald-600">Finance Tracker</div>
        <Sidebar />
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm md:mt-auto dark:border-slate-800">
          <div className="truncate font-medium">{user.name}</div>
          <div className="truncate text-slate-500">{user.email}</div>
          <form action={logout} className="mt-2">
            <button type="submit" className="text-slate-600 hover:text-emerald-600 dark:text-slate-400">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
