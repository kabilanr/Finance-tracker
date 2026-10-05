"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { getCategory } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { isUuid } from "@/lib/transaction-schema";

export type FormState = { error?: string; ok?: boolean } | undefined;

const Amount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a monthly limit with at most two decimal places." })
  .transform(Number)
  .refine((n) => n > 0, { error: "The limit must be more than zero." })
  .refine((n) => n < 1_000_000_000_000, { error: "The limit is too large." });

export async function saveBudget(_state: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await verifySession();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!isUuid(categoryId)) return { error: "Choose a category." };
  const amount = Amount.safeParse(String(formData.get("amount") ?? ""));
  if (!amount.success) return { error: amount.error.issues[0].message };

  const category = await getCategory(userId, categoryId);
  if (!category || category.type !== "expense") return { error: "Choose an expense category." };

  await db
    .insert(budgets)
    .values({ userId, categoryId, amount: amount.data.toFixed(2) })
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.categoryId],
      set: { amount: amount.data.toFixed(2) },
    });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBudget(id: string) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
}
