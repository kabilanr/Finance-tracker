import "server-only";
import { and, desc, eq, getTableColumns, gte, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions, type TransactionType } from "@/db/schema";
import { monthRange } from "./dates";

export type TransactionFilters = {
  month?: string; // YYYY-MM, or undefined for all time
  type?: TransactionType;
  category?: string; // category id, or "none" for uncategorized
  q?: string;
};

function buildWhere(userId: string, filters: TransactionFilters) {
  const conditions: SQL[] = [eq(transactions.userId, userId)];
  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    conditions.push(gte(transactions.date, start), lt(transactions.date, end));
  }
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.category === "none") conditions.push(isNull(transactions.categoryId));
  else if (filters.category) conditions.push(eq(transactions.categoryId, filters.category));
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(transactions.description, pattern),
        ilike(categories.name, pattern),
        ilike(transactions.note, pattern),
      )!,
    );
  }
  return and(...conditions);
}

export async function listTransactions(userId: string, filters: TransactionFilters, limit?: number) {
  const query = db
    .select({
      ...getTableColumns(transactions),
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(buildWhere(userId, filters))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  return limit ? query.limit(limit) : query;
}

export type TransactionRow = Awaited<ReturnType<typeof listTransactions>>[number];

export async function getTotals(userId: string, filters: TransactionFilters) {
  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(buildWhere(userId, filters));
  const income = Number(row.income);
  const expense = Number(row.expense);
  return { income, expense, balance: income - expense };
}

export async function getTransaction(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return row ?? null;
}
