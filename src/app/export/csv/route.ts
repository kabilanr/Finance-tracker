import type { NextRequest } from "next/server";
import type { TransactionType } from "@/db/schema";
import { listTransfers } from "@/lib/accounts";
import { toCsv } from "@/lib/csv";
import { verifySession } from "@/lib/dal";
import { isMonth, monthRange } from "@/lib/dates";
import { isUuid } from "@/lib/transaction-schema";
import { listTransactions, type TransactionFilters } from "@/lib/transactions";

const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

// GET /export/csv?what=transactions|transfers plus the same filters as the
// transactions list (month or from/to, type, category, account, q).
export async function GET(request: NextRequest) {
  const { userId } = await verifySession();
  const params = request.nextUrl.searchParams;

  const filters: TransactionFilters = {};
  const month = params.get("month");
  if (isMonth(month ?? undefined)) {
    const { start, end } = monthRange(month!);
    filters.from = start;
    filters.to = new Date(Date.parse(end) - 86_400_000).toISOString().slice(0, 10);
  }
  if (isDate(params.get("from"))) filters.from = params.get("from")!;
  if (isDate(params.get("to"))) filters.to = params.get("to")!;
  const type = params.get("type");
  if (type === "income" || type === "expense") filters.type = type as TransactionType;
  const category = params.get("category");
  if (category === "none" || (category && isUuid(category))) filters.category = category;
  const account = params.get("account");
  if (account && isUuid(account)) filters.account = account;
  const q = params.get("q")?.trim();
  if (q) filters.q = q;

  const range = filters.from || filters.to ? `${filters.from ?? "start"}_to_${filters.to ?? "today"}` : "all-time";
  let csv: string;
  let name: string;

  if (params.get("what") === "transfers") {
    const rows = (await listTransfers(userId, 100_000)).filter(
      (t) => (!filters.from || t.date >= filters.from) && (!filters.to || t.date <= filters.to),
    );
    csv = toCsv(
      ["Date", "From account", "To account", "Amount", "Note"],
      rows.map((t) => [t.date, t.fromName, t.toName, Number(t.amount), t.note]),
    );
    name = `transfers_${range}.csv`;
  } else {
    const rows = await listTransactions(userId, filters);
    csv = toCsv(
      ["Date", "Type", "Description", "Category", "Account", "Amount", "Note", "Recurring"],
      rows.map((t) => [
        t.date,
        t.type === "income" ? "Income" : "Expense",
        t.description,
        t.categoryName ?? "Uncategorized",
        t.accountName,
        t.type === "income" ? Number(t.amount) : -Number(t.amount),
        t.note,
        t.recurringRuleId ? "Yes" : "",
      ]),
    );
    name = `transactions_${range}.csv`;
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
