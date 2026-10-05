import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categories, recurringRules, transactions, type RecurringRule } from "@/db/schema";
import { occurrenceDate, today } from "./dates";

// Upper bound on entries created for one rule in one run, so a rule with a
// start date far in the past can't create thousands of rows at once.
const MAX_PER_RUN = 120;

export function nextOccurrence(rule: Pick<RecurringRule, "startDate" | "frequency" | "generatedCount" | "endDate">) {
  const next = occurrenceDate(rule.startDate, rule.frequency, rule.generatedCount);
  return rule.endDate && next > rule.endDate ? null : next;
}

export async function listRules(userId: string) {
  const rows = await db
    .select({
      rule: recurringRules,
      accountName: accounts.name,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(recurringRules)
    .innerJoin(accounts, eq(accounts.id, recurringRules.accountId))
    .leftJoin(categories, eq(categories.id, recurringRules.categoryId))
    .where(eq(recurringRules.userId, userId))
    .orderBy(asc(recurringRules.description));
  return rows.map((r) => ({
    ...r.rule,
    accountName: r.accountName,
    categoryName: r.categoryName,
    categoryColor: r.categoryColor,
    next: nextOccurrence(r.rule),
  }));
}

export type RuleRow = Awaited<ReturnType<typeof listRules>>[number];

export async function getRule(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));
  return row ?? null;
}

// Turns every occurrence that is due (on or before today) into a transaction.
// Safe to run concurrently: each rule's counter is advanced with a
// compare-and-set, so an occurrence is only ever created once.
export async function generateDueTransactions(userId?: string) {
  const day = today();
  const rules = await db
    .select()
    .from(recurringRules)
    .where(
      userId
        ? and(eq(recurringRules.active, true), eq(recurringRules.userId, userId))
        : eq(recurringRules.active, true),
    );

  let created = 0;
  for (const rule of rules) {
    const dates: string[] = [];
    for (let k = rule.generatedCount; dates.length < MAX_PER_RUN; k++) {
      const date = occurrenceDate(rule.startDate, rule.frequency, k);
      if (date > day || (rule.endDate && date > rule.endDate)) break;
      dates.push(date);
    }
    if (dates.length === 0) continue;

    created += await db.transaction(async (tx) => {
      const claimed = await tx
        .update(recurringRules)
        .set({ generatedCount: rule.generatedCount + dates.length })
        .where(and(eq(recurringRules.id, rule.id), eq(recurringRules.generatedCount, rule.generatedCount)))
        .returning({ id: recurringRules.id });
      if (claimed.length === 0) return 0; // another run got here first
      await tx.insert(transactions).values(
        dates.map((date) => ({
          userId: rule.userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount: rule.amount,
          date,
          description: rule.description,
          note: rule.note,
          recurringRuleId: rule.id,
        })),
      );
      return dates.length;
    });
  }
  return created;
}
