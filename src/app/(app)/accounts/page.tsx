import type { Metadata } from "next";
import { AccountsManager } from "@/components/AccountsManager";
import { ACCOUNT_KINDS, listAccountsWithBalances, listTransfers } from "@/lib/accounts";
import { verifySession } from "@/lib/dal";
import { today } from "@/lib/dates";

export const metadata: Metadata = { title: "Accounts · Finance Tracker" };

export default async function AccountsPage() {
  const { userId } = await verifySession();
  const [accounts, transfers] = await Promise.all([listAccountsWithBalances(userId), listTransfers(userId)]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <p className="text-sm text-slate-500">Cash, bank accounts and cards, with their current balances.</p>
      </div>
      <AccountsManager accounts={accounts} transfers={transfers} kinds={ACCOUNT_KINDS} today={today()} />
    </div>
  );
}
