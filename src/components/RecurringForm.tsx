"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { RuleFormState } from "@/app/actions/recurring";
import type { RecurringRule, TransactionType } from "@/db/schema";
import type { AccountOption } from "@/lib/accounts";
import type { CategoryOption } from "@/lib/categories";

type Action = (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1 text-xs text-red-600">{errors[0]}</p> : null;
}

export function RecurringForm({
  action,
  rule,
  categories,
  accounts,
  defaultDate,
  submitLabel,
}: {
  action: Action;
  rule?: RecurringRule;
  categories: CategoryOption[];
  accounts: AccountOption[];
  defaultDate: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values;
  const editing = !!rule;
  const [type, setType] = useState<TransactionType>(rule?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? "");
  const options = categories.filter((c) => c.type === type);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset disabled={editing}>
        <legend className="text-sm">Type</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm capitalize has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:font-medium has-disabled:cursor-default dark:border-slate-700 dark:has-checked:bg-emerald-950"
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => {
                  setType(t);
                  setCategoryId("");
                }}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
        <FieldError errors={state?.errors?.type} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Amount (₹)
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={v?.amount ?? rule?.amount ?? ""}
            className={inputClass}
          />
          <FieldError errors={state?.errors?.amount} />
        </label>
        <label className="block text-sm">
          Repeats
          <select
            name="frequency"
            defaultValue={v?.frequency ?? rule?.frequency ?? "monthly"}
            disabled={editing}
            className={inputClass}
          >
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
          </select>
          <FieldError errors={state?.errors?.frequency} />
        </label>
      </div>

      <label className="block text-sm">
        Description
        <input
          name="description"
          placeholder="e.g. Rent, Salary, Netflix"
          defaultValue={v?.description ?? rule?.description ?? ""}
          className={inputClass}
        />
        <FieldError errors={state?.errors?.description} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Account
          <select name="accountId" defaultValue={v?.accountId ?? rule?.accountId ?? accounts[0]?.id} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.accountId} />
        </label>
        <label className="block text-sm">
          Category
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Uncategorized</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.categoryId} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Starts on
          <input
            name="startDate"
            type="date"
            defaultValue={v?.startDate ?? rule?.startDate ?? defaultDate}
            disabled={editing}
            className={inputClass}
          />
          <FieldError errors={state?.errors?.startDate} />
        </label>
        <label className="block text-sm">
          Ends on <span className="text-slate-400">(optional)</span>
          <input
            name="endDate"
            type="date"
            defaultValue={v?.endDate ?? rule?.endDate ?? ""}
            className={inputClass}
          />
          <FieldError errors={state?.errors?.endDate} />
        </label>
      </div>

      <label className="block text-sm">
        Note <span className="text-slate-400">(optional)</span>
        <textarea name="note" rows={2} defaultValue={v?.note ?? rule?.note ?? ""} className={inputClass} />
      </label>

      {editing ? (
        <p className="text-xs text-slate-500">
          Type, schedule and start date can&apos;t be changed. Changes apply to future entries only.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          If the start date is in the past, the entries since then are added straight away.
        </p>
      )}

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/recurring"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
