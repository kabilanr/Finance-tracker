"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { recurringRules } from "@/db/schema";
import { getAccount } from "@/lib/accounts";
import { getCategory } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { occurrenceDate, today } from "@/lib/dates";
import { generateDueTransactions, getRule } from "@/lib/recurring";
import { isUuid } from "@/lib/transaction-schema";

export type RuleFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string; values?: Record<string, string> }
  | undefined;

const RuleSchema = z
  .object({
    type: z.enum(["income", "expense"], { error: "Choose income or expense." }),
    amount: z
      .string({ error: "Enter an amount." })
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a number with at most two decimal places." })
      .transform(Number)
      .refine((n) => n > 0, { error: "Amount must be more than zero." })
      .refine((n) => n < 1_000_000_000_000, { error: "Amount is too large." }),
    description: z.string().trim().min(1, { error: "Add a short description." }).max(200),
    note: z.string().trim().max(1000).optional(),
    accountId: z.uuid({ error: "Choose an account." }),
    categoryId: z.uuid({ error: "Pick a category from the list." }).optional(),
    frequency: z.enum(["weekly", "monthly", "yearly"], { error: "Choose how often it repeats." }),
    startDate: z.iso.date({ error: "Pick a valid start date." }),
    endDate: z.iso.date({ error: "Pick a valid end date." }).optional(),
  })
  .refine((r) => !r.endDate || r.endDate >= r.startDate, {
    error: "The end date must be on or after the start date.",
    path: ["endDate"],
  });

function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) if (typeof value === "string") values[key] = value;
  return values;
}

function parse(formData: FormData, existing?: { type: string; frequency: string; startDate: string }) {
  const optional = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value === "" ? undefined : value;
  };
  return RuleSchema.safeParse({
    // The schedule itself can't change after creation, only its details.
    type: existing?.type ?? formData.get("type"),
    frequency: existing?.frequency ?? formData.get("frequency"),
    startDate: existing?.startDate ?? formData.get("startDate"),
    amount: String(formData.get("amount") ?? ""),
    description: formData.get("description") ?? "",
    note: optional("note"),
    accountId: formData.get("accountId"),
    categoryId: optional("categoryId"),
    endDate: optional("endDate"),
  });
}

async function checkRefs(userId: string, data: z.infer<typeof RuleSchema>) {
  if (!(await getAccount(userId, data.accountId))) return { accountId: ["Choose an account."] };
  if (data.categoryId) {
    const category = await getCategory(userId, data.categoryId);
    if (category?.type !== data.type) return { categoryId: ["Pick a category that matches the type."] };
  }
  return null;
}

function toRow(data: z.infer<typeof RuleSchema>) {
  return {
    type: data.type,
    amount: data.amount.toFixed(2),
    description: data.description,
    note: data.note ?? null,
    accountId: data.accountId,
    categoryId: data.categoryId ?? null,
    frequency: data.frequency,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
  };
}

export async function createRule(_state: RuleFormState, formData: FormData): Promise<RuleFormState> {
  const { userId } = await verifySession();
  const parsed = parse(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  const refErrors = await checkRefs(userId, parsed.data);
  if (refErrors) return { errors: refErrors, values: formValues(formData) };

  await db.insert(recurringRules).values({ userId, ...toRow(parsed.data) });
  await generateDueTransactions(userId);
  revalidatePath("/", "layout");
  redirect("/recurring");
}

export async function updateRule(id: string, _state: RuleFormState, formData: FormData): Promise<RuleFormState> {
  const { userId } = await verifySession();
  const rule = isUuid(id) ? await getRule(userId, id) : null;
  if (!rule) return { message: "This recurring item no longer exists." };
  const parsed = parse(formData, rule);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  const refErrors = await checkRefs(userId, parsed.data);
  if (refErrors) return { errors: refErrors, values: formValues(formData) };

  await db
    .update(recurringRules)
    .set(toRow(parsed.data))
    .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));
  await generateDueTransactions(userId);
  revalidatePath("/", "layout");
  redirect("/recurring");
}

export async function setRuleActive(id: string, active: boolean) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  const rule = await getRule(userId, id);
  if (!rule) return;
  // Resuming skips the occurrences missed while paused instead of back-filling them.
  let generatedCount = rule.generatedCount;
  if (active && !rule.active) {
    const day = today();
    while (occurrenceDate(rule.startDate, rule.frequency, generatedCount) < day) generatedCount++;
  }
  await db
    .update(recurringRules)
    .set({ active, generatedCount })
    .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));
  if (active) await generateDueTransactions(userId);
  revalidatePath("/", "layout");
  refresh();
}

export async function deleteRule(id: string) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  // Entries already created stay; they just lose their link to the rule.
  await db.delete(recurringRules).where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
}
