"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { verifySession } from "@/lib/dal";
import { isUuid, TransactionSchema, type TransactionFormState } from "@/lib/transaction-schema";

function parse(formData: FormData) {
  const optional = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value === "" ? undefined : value;
  };
  return TransactionSchema.safeParse({
    type: formData.get("type"),
    amount: optional("amount"),
    date: formData.get("date"),
    description: formData.get("description") ?? "",
    category: optional("category"),
    note: optional("note"),
  });
}

function invalid(error: z.ZodError, formData: FormData): TransactionFormState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) if (typeof value === "string") values[key] = value;
  return { errors: z.flattenError(error).fieldErrors, values };
}

function toRow(data: z.infer<typeof TransactionSchema>) {
  return {
    type: data.type,
    amount: data.amount.toFixed(2),
    date: data.date,
    description: data.description,
    category: data.category ?? null,
    note: data.note ?? null,
  };
}

export async function createTransaction(
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { userId } = await verifySession();
  const parsed = parse(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  await db.insert(transactions).values({ userId, ...toRow(parsed.data) });
  revalidatePath("/", "layout");
  redirect(`/transactions?month=${parsed.data.date.slice(0, 7)}`);
}

export async function updateTransaction(
  id: string,
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { userId } = await verifySession();
  if (!isUuid(id)) return { message: "This transaction no longer exists." };
  const parsed = parse(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const updated = await db
    .update(transactions)
    .set(toRow(parsed.data))
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  if (updated.length === 0) return { message: "This transaction no longer exists." };

  revalidatePath("/", "layout");
  redirect(`/transactions?month=${parsed.data.date.slice(0, 7)}`);
}

export async function deleteTransaction(id: string) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
}
