"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav";

export function Sidebar({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {navItems.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
              (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                ? "bg-emerald-600 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {item.label}
            {badges[item.href] ? (
              <span
                className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                aria-label={`${badges[item.href]} alerts`}
              >
                {badges[item.href]}
              </span>
            ) : null}
          </Link>
        ) : (
          <span
            key={item.href}
            title="Coming soon"
            className="cursor-not-allowed whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-400 dark:text-slate-600"
          >
            {item.label}
          </span>
        ),
      )}
    </nav>
  );
}
