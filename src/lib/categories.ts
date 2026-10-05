import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "./default-categories";

export async function listCategories(userId: string) {
  return db
    .select({ id: categories.id, type: categories.type, name: categories.name, color: categories.color })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.type), asc(categories.name));
}

export type CategoryOption = Awaited<ReturnType<typeof listCategories>>[number];

export async function listCategoriesWithCounts(userId: string) {
  return db
    .select({
      id: categories.id,
      type: categories.type,
      name: categories.name,
      color: categories.color,
      transactionCount: count(transactions.id),
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export async function getCategory(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return row ?? null;
}

export async function seedDefaultCategories(userId: string) {
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })))
    .onConflictDoNothing();
}
