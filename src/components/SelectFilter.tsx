"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// A <select> that updates one query-string parameter as soon as it changes.
export function SelectFilter({
  param,
  value,
  options,
  label,
}: {
  param: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(searchParams);
        if (e.target.value) next.set(param, e.target.value);
        else next.delete(param);
        router.push(`${pathname}?${next}`);
      }}
      className="rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
