import "server-only";
import { and, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { transactions, type TransactionType } from "@/db/schema";
import { monthRange } from "./dates";

export type TransactionFilters = {
  month?: string; // YYYY-MM, or undefined for all time
  type?: TransactionType;
  q?: string;
};

function buildWhere(userId: string, filters: TransactionFilters) {
  const conditions: SQL[] = [eq(transactions.userId, userId)];
  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    conditions.push(gte(transactions.date, start), lt(transactions.date, end));
  }
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(transactions.description, pattern),
        ilike(transactions.category, pattern),
        ilike(transactions.note, pattern),
      )!,
    );
  }
  return and(...conditions);
}

export async function listTransactions(userId: string, filters: TransactionFilters) {
  return db
    .select()
    .from(transactions)
    .where(buildWhere(userId, filters))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function getTotals(userId: string, filters: TransactionFilters) {
  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
    })
    .from(transactions)
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
