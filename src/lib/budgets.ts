import "server-only";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { monthRange } from "./dates";

export const WARNING_RATIO = 0.8;

export type BudgetStatus = "ok" | "warning" | "over";

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return "over";
  if (spent >= limit * WARNING_RATIO) return "warning";
  return "ok";
}

// Monthly budgets with what has been spent in each category during `month`.
export async function listBudgetsForMonth(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const spent = db
    .select({
      categoryId: transactions.categoryId,
      total: sql<string>`sum(${transactions.amount})`.as("total"),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lt(transactions.date, end),
      ),
    )
    .groupBy(transactions.categoryId)
    .as("spent");

  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      amount: budgets.amount,
      spent: sql<string>`coalesce(${spent.total}, 0)`,
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .leftJoin(spent, eq(spent.categoryId, budgets.categoryId))
    .where(eq(budgets.userId, userId))
    .orderBy(asc(categories.name));

  return rows.map((r) => {
    const limit = Number(r.amount);
    const spentAmount = Number(r.spent);
    return {
      ...r,
      limit,
      spent: spentAmount,
      remaining: limit - spentAmount,
      ratio: limit > 0 ? spentAmount / limit : 0,
      status: budgetStatus(spentAmount, limit),
    };
  });
}

export type BudgetRow = Awaited<ReturnType<typeof listBudgetsForMonth>>[number];

export async function budgetAlerts(userId: string, month: string) {
  return (await listBudgetsForMonth(userId, month)).filter((b) => b.status !== "ok");
}
