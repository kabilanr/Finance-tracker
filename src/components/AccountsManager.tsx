"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  createAccount,
  createTransfer,
  deleteAccount,
  deleteTransfer,
  updateAccount,
  type FormState,
} from "@/app/actions/accounts";
import type { AccountKind } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type Account = { id: string; name: string; kind: AccountKind; openingBalance: string; balance: number; usage: number };
type TransferRow = { id: string; amount: string; date: string; note: string | null; fromName: string; toName: string };
type KindOption = { value: AccountKind; label: string };

const inputClass =
  "w-full rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950";
const primaryButton =
  "rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";

function AccountFields({ kinds, account }: { kinds: KindOption[]; account?: Account }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="text-xs text-slate-500">
        Name
        <input name="name" defaultValue={account?.name} placeholder="e.g. HDFC Savings" className={inputClass} />
      </label>
      <label className="text-xs text-slate-500">
        Type
        <select name="kind" defaultValue={account?.kind ?? "bank"} className={inputClass}>
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Opening balance (₹)
        <input
          name="openingBalance"
          inputMode="decimal"
          defaultValue={account ? Number(account.openingBalance).toString() : ""}
          placeholder="0"
          className={inputClass}
        />
      </label>
    </div>
  );
}

function AccountCard({ account, kinds }: { account: Account; kinds: KindOption[] }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updateAccount(account.id, prev, formData);
    if (result?.ok) setEditing(false);
    return result;
  }, undefined);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDelete] = useTransition();
  const kindLabel = kinds.find((k) => k.value === account.kind)?.label;

  if (editing) {
    return (
      <form action={action} className="space-y-3 rounded-lg border border-emerald-600 p-4 sm:col-span-2 lg:col-span-3">
        <AccountFields kinds={kinds} account={account} />
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-2 text-sm text-slate-600 dark:text-slate-400">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{account.name}</div>
          <div className="text-xs text-slate-500">{kindLabel}</div>
        </div>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => setEditing(true)} className="text-slate-600 hover:underline dark:text-slate-400">
            Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              setDeleteError(undefined);
              if (!confirm(`Delete "${account.name}"?`)) return;
              startDelete(async () => {
                const result = await deleteAccount(account.id);
                if (result?.error) setDeleteError(result.error);
              });
            }}
            className="text-red-600 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className={`mt-3 text-2xl font-semibold tabular-nums ${account.balance < 0 ? "text-red-600" : ""}`}>
        {formatMoney(account.balance)}
      </div>
      <Link
        href={`/transactions?month=all&account=${account.id}`}
        className="mt-1 text-xs text-slate-500 hover:underline"
      >
        View entries
      </Link>
      {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
    </div>
  );
}

function AddAccountForm({ kinds }: { kinds: KindOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await createAccount(prev, formData);
    if (result?.ok) setOpen(false);
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-700"
      >
        + Add account
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 sm:col-span-2 lg:col-span-3 dark:border-slate-700">
      <AccountFields kinds={kinds} />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          Add account
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm text-slate-600 dark:text-slate-400">
          Cancel
        </button>
      </div>
    </form>
  );
}

function TransferForm({ accounts, today }: { accounts: Account[]; today: string }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await createTransfer(prev, formData);
    if (result?.ok) setFormKey((k) => k + 1);
    return result;
  }, undefined);

  if (accounts.length < 2) {
    return <p className="text-sm text-slate-500">Add a second account to move money between accounts.</p>;
  }
  return (
    <form key={formKey} action={action} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-500">
          From
          <select name="fromAccountId" defaultValue={accounts[0].id} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          To
          <select name="toAccountId" defaultValue={accounts[1].id} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Amount (₹)
          <input name="amount" inputMode="decimal" placeholder="0.00" className={inputClass} />
        </label>
        <label className="text-xs text-slate-500">
          Date
          <input name="date" type="date" defaultValue={today} className={inputClass} />
        </label>
      </div>
      <label className="block text-xs text-slate-500">
        Note (optional)
        <input name="note" placeholder="e.g. Credit card bill" className={inputClass} />
      </label>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className={primaryButton}>
        Transfer
      </button>
    </form>
  );
}

function TransferList({ transfers }: { transfers: TransferRow[] }) {
  const [pending, startTransition] = useTransition();
  if (transfers.length === 0) return null;
  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {transfers.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <div className="min-w-0">
            <div className="truncate">
              {t.fromName} → {t.toName}
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(t.date)}
              {t.note && ` · ${t.note}`}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-medium tabular-nums">{formatMoney(t.amount)}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("Delete this transfer?")) startTransition(() => deleteTransfer(t.id));
              }}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AccountsManager({
  accounts,
  transfers,
  kinds,
  today,
}: {
  accounts: Account[];
  transfers: TransferRow[];
  kinds: KindOption[];
  today: string;
}) {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
        <div className="text-sm text-slate-500">Total across all accounts</div>
        <div className={`text-3xl font-semibold tabular-nums ${total < 0 ? "text-red-600" : ""}`}>{formatMoney(total)}</div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} kinds={kinds} />
        ))}
        <AddAccountForm kinds={kinds} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Transfers</h2>
        <p className="text-sm text-slate-500">
          Move money between your accounts. Transfers change balances but don&apos;t count as income or expenses.
        </p>
        <TransferForm accounts={accounts} today={today} />
        <TransferList transfers={transfers} />
      </section>
    </div>
  );
}
