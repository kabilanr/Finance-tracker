import "server-only";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { monthRange, shiftMonth } from "./dates";

export type MonthTotals = { month: string; income: number; expense: number };

// Income and expense per month for the `count` months ending at `lastMonth`,
// including months with no entries.
export async function monthlyTotals(userId: string, lastMonth: string, count: number): Promise<MonthTotals[]> {
  const firstMonth = shiftMonth(lastMonth, -(count - 1));
  const { start } = monthRange(firstMonth);
  const { end } = monthRange(lastMonth);
  const month = sql<string>`to_char(${transactions.date}, 'YYYY-MM')`;
  const rows = await db
    .select({
      month,
      income: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, start), lt(transactions.date, end)))
    .groupBy(month);

  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return Array.from({ length: count }, (_, i) => {
    const m = shiftMonth(firstMonth, i);
    const row = byMonth.get(m);
    return { month: m, income: Number(row?.income ?? 0), expense: Number(row?.expense ?? 0) };
  });
}

export type CategorySpend = { id: string | null; name: string; color: string; total: number };

export async function spendingByCategory(userId: string, month: string): Promise<CategorySpend[]> {
  const { start, end } = monthRange(month);
  const total = sql<string>`sum(${transactions.amount})`;
  const rows = await db
    .select({ id: categories.id, name: categories.name, color: categories.color, total })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lt(transactions.date, end),
      ),
    )
    .groupBy(categories.id, categories.name, categories.color)
    .orderBy(desc(total));
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "Uncategorized",
    color: r.color ?? "#94a3b8",
    total: Number(r.total),
  }));
}
