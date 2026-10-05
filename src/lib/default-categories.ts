import type { TransactionType } from "@/db/schema";

export const CATEGORY_COLORS = [
  "#10b981", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#64748b",
];

// Keep in sync with drizzle/0003_migrate_category_data.sql, which seeds
// these for accounts created before categories existed.
export const DEFAULT_CATEGORIES: { type: TransactionType; name: string; color: string }[] = [
  { type: "expense", name: "Food", color: "#f97316" },
  { type: "expense", name: "Rent", color: "#6366f1" },
  { type: "expense", name: "Transport", color: "#0ea5e9" },
  { type: "expense", name: "Bills", color: "#eab308" },
  { type: "expense", name: "Shopping", color: "#ec4899" },
  { type: "expense", name: "Health", color: "#ef4444" },
  { type: "expense", name: "Entertainment", color: "#a855f7" },
  { type: "expense", name: "Other", color: "#64748b" },
  { type: "income", name: "Salary", color: "#10b981" },
  { type: "income", name: "Business", color: "#84cc16" },
  { type: "income", name: "Gifts", color: "#ec4899" },
  { type: "income", name: "Other", color: "#64748b" },
];
