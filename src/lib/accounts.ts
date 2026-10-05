import "server-only";
import { aliasedTable, and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, transfers, type AccountKind } from "@/db/schema";

export const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank account" },
  { value: "card", label: "Credit card" },
  { value: "wallet", label: "Wallet / UPI" },
  { value: "other", label: "Other" },
];

export async function listAccounts(userId: string) {
  return db
    .select({ id: accounts.id, name: accounts.name, kind: accounts.kind })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.createdAt));
}

export type AccountOption = Awaited<ReturnType<typeof listAccounts>>[number];

// Drizzle leaves column names unqualified in single-table selects, which
// would bind to the subquery's own table, so reference the outer row explicitly.
const accountRowId = sql.raw(`"accounts"."id"`);

// Balance = opening balance + income - expenses - transfers out + transfers in.
export async function listAccountsWithBalances(userId: string) {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      kind: accounts.kind,
      openingBalance: accounts.openingBalance,
      balance: sql<string>`${accounts.openingBalance}
        + coalesce((select sum(case when t.type = 'income' then t.amount else -t.amount end)
                    from ${transactions} t where t.account_id = ${accountRowId}), 0)
        - coalesce((select sum(x.amount) from ${transfers} x where x.from_account_id = ${accountRowId}), 0)
        + coalesce((select sum(x.amount) from ${transfers} x where x.to_account_id = ${accountRowId}), 0)`,
      usage: sql<number>`(select count(*) from ${transactions} t where t.account_id = ${accountRowId})::int
        + (select count(*) from ${transfers} x where x.from_account_id = ${accountRowId} or x.to_account_id = ${accountRowId})::int`,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.createdAt));
  return rows.map((r) => ({ ...r, balance: Number(r.balance) }));
}

export async function getAccount(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return row ?? null;
}

export async function listTransfers(userId: string, limit = 20) {
  const from = aliasedTable(accounts, "from_account");
  const to = aliasedTable(accounts, "to_account");
  return db
    .select({
      id: transfers.id,
      amount: transfers.amount,
      date: transfers.date,
      note: transfers.note,
      fromName: from.name,
      toName: to.name,
    })
    .from(transfers)
    .innerJoin(from, eq(from.id, transfers.fromAccountId))
    .innerJoin(to, eq(to.id, transfers.toAccountId))
    .where(eq(transfers.userId, userId))
    .orderBy(desc(transfers.date), desc(transfers.createdAt))
    .limit(limit);
}

export async function seedDefaultAccount(userId: string) {
  await db.insert(accounts).values({ userId, name: "Cash", kind: "cash" }).onConflictDoNothing();
}
