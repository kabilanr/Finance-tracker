"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getAccount } from "@/lib/accounts";
import { getCategory } from "@/lib/categories";
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
    accountId: formData.get("accountId"),
    categoryId: optional("categoryId"),
    note: optional("note"),
  });
}

function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) if (typeof value === "string") values[key] = value;
  return values;
}

function invalid(error: z.ZodError, formData: FormData): TransactionFormState {
  return { errors: z.flattenError(error).fieldErrors, values: formValues(formData) };
}

// The account must belong to the user; a category must also match the type.
async function checkRefs(
  userId: string,
  data: z.infer<typeof TransactionSchema>,
  formData: FormData,
): Promise<TransactionFormState | null> {
  if (!(await getAccount(userId, data.accountId))) {
    return { errors: { accountId: ["Choose an account."] }, values: formValues(formData) };
  }
  if (data.categoryId) {
    const category = await getCategory(userId, data.categoryId);
    if (category?.type !== data.type) {
      return { errors: { categoryId: ["Pick a category that matches the type."] }, values: formValues(formData) };
    }
  }
  return null;
}

function toRow(data: z.infer<typeof TransactionSchema>) {
  return {
    type: data.type,
    amount: data.amount.toFixed(2),
    date: data.date,
    description: data.description,
    accountId: data.accountId,
    categoryId: data.categoryId ?? null,
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
  const refError = await checkRefs(userId, parsed.data, formData);
  if (refError) return refError;

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
  const refError = await checkRefs(userId, parsed.data, formData);
  if (refError) return refError;

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
