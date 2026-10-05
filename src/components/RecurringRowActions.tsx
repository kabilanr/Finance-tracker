"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteRule, setRuleActive } from "@/app/actions/recurring";

export function RecurringRowActions({ id, active, description }: { id: string; active: boolean; description: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-3 text-xs">
      <Link href={`/recurring/${id}/edit`} className="text-slate-600 hover:underline dark:text-slate-400">
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setRuleActive(id, !active))}
        className="text-slate-600 hover:underline disabled:opacity-50 dark:text-slate-400"
      >
        {active ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Stop "${description}" from repeating? Entries already added are kept.`)) {
            startTransition(() => deleteRule(id));
          }
        }}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
