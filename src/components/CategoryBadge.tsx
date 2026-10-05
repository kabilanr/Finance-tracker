export function CategoryBadge({ name, color }: { name: string | null; color: string | null }) {
  if (!name) return <span className="text-slate-400">Uncategorized</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? "#64748b" }} />
      {name}
    </span>
  );
}
