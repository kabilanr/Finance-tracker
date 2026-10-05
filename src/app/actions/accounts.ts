"use server";

import { and, eq, or } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { accounts, recurringRules, transactions, transfers } from "@/db/schema";
import { getAccount } from "@/lib/accounts";
import { verifySession } from "@/lib/dal";
import { isUuid } from "@/lib/transaction-schema";

export type FormState = { error?: string; ok?: boolean } | undefined;

const money = (label: string, { allowNegative = false, allowZero = false } = {}) =>
  z
    .string()
    .trim()
    .regex(allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/, {
      error: `${label}: enter a number with at most two decimal places.`,
    })
    .transform(Number)
    .refine((n) => allowZero || n > 0, { error: `${label} must be more than zero.` })
    .refine((n) => Math.abs(n) < 1_000_000_000_000, { error: `${label} is too large.` });

const AccountSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter a name." }).max(40, { error: "Keep the name under 40 characters." }),
  kind: z.enum(["cash", "bank", "card", "wallet", "other"], { error: "Choose an account type." }),
  openingBalance: money("Opening balance", { allowNegative: true, allowZero: true }),
});

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function parseAccount(formData: FormData) {
  return AccountSchema.safeParse({
    name: formData.get("name") ?? "",
    kind: formData.get("kind"),
    openingBalance: String(formData.get("openingBalance") ?? "").trim() || "0",
  });
}

function done(): FormState {
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createAccount(_state: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await verifySession();
  const parsed = parseAccount(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { openingBalance, ...rest } = parsed.data;
  try {
    await db.insert(accounts).values({ userId, ...rest, openingBalance: openingBalance.toFixed(2) });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `You already have an account called "${rest.name}".` };
    throw error;
  }
  return done();
}

export async function updateAccount(id: string, _state: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await verifySession();
  if (!isUuid(id)) return { error: "This account no longer exists." };
  const parsed = parseAccount(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { openingBalance, ...rest } = parsed.data;
  try {
    const updated = await db
      .update(accounts)
      .set({ ...rest, openingBalance: openingBalance.toFixed(2) })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning({ id: accounts.id });
    if (updated.length === 0) return { error: "This account no longer exists." };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `You already have an account called "${rest.name}".` };
    throw error;
  }
  return done();
}

export async function deleteAccount(id: string): Promise<FormState> {
  const { userId } = await verifySession();
  if (!isUuid(id)) return { error: "This account no longer exists." };
  const used =
    (await db.$count(transactions, and(eq(transactions.userId, userId), eq(transactions.accountId, id)))) +
    (await db.$count(
      transfers,
      and(eq(transfers.userId, userId), or(eq(transfers.fromAccountId, id), eq(transfers.toAccountId, id))),
    )) +
    (await db.$count(recurringRules, and(eq(recurringRules.userId, userId), eq(recurringRules.accountId, id))));
  if (used > 0) {
    return { error: "This account has entries, transfers or recurring items. Move or delete them first." };
  }
  if ((await db.$count(accounts, eq(accounts.userId, userId))) <= 1) return { error: "You need at least one account." };
  await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
  return { ok: true };
}

const TransferSchema = z
  .object({
    fromAccountId: z.uuid({ error: "Choose the account to move money from." }),
    toAccountId: z.uuid({ error: "Choose the account to move money to." }),
    amount: money("Amount"),
    date: z.iso.date({ error: "Pick a valid date." }),
    note: z.string().trim().max(200).optional(),
  })
  .refine((t) => t.fromAccountId !== t.toAccountId, { error: "Pick two different accounts." });

export async function createTransfer(_state: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await verifySession();
  const note = String(formData.get("note") ?? "").trim();
  const parsed = TransferSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: String(formData.get("amount") ?? ""),
    date: formData.get("date"),
    note: note || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { fromAccountId, toAccountId, amount, date } = parsed.data;
  const [from, to] = await Promise.all([getAccount(userId, fromAccountId), getAccount(userId, toAccountId)]);
  if (!from || !to) return { error: "One of those accounts no longer exists." };

  await db.insert(transfers).values({
    userId,
    fromAccountId,
    toAccountId,
    amount: amount.toFixed(2),
    date,
    note: parsed.data.note ?? null,
  });
  return done();
}

export async function deleteTransfer(id: string) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  await db.delete(transfers).where(and(eq(transfers.id, id), eq(transfers.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
}
