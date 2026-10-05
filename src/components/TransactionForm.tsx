"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Transaction, TransactionType } from "@/db/schema";
import type { CategoryOption } from "@/lib/categories";
import type { TransactionFormState } from "@/lib/transaction-schema";

type Action = (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-slate-700";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1 text-xs text-red-600">{errors[0]}</p> : null;
}

export function TransactionForm({
  action,
  transaction,
  categories,
  defaultDate,
  submitLabel,
}: {
  action: Action;
  transaction?: Transaction;
  categories: CategoryOption[];
  defaultDate: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values;
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const options = categories.filter((c) => c.type === type);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="text-sm">Type</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm capitalize has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:font-medium dark:border-slate-700 dark:has-checked:bg-emerald-950"
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
            defaultValue={v?.amount ?? transaction?.amount ?? ""}
            className={inputClass}
          />
          <FieldError errors={state?.errors?.amount} />
        </label>
        <label className="block text-sm">
          Date
          <input
            name="date"
            type="date"
            defaultValue={v?.date ?? transaction?.date ?? defaultDate}
            className={inputClass}
          />
          <FieldError errors={state?.errors?.date} />
        </label>
      </div>

      <label className="block text-sm">
        Description
        <input
          name="description"
          placeholder="e.g. Groceries, March salary"
          defaultValue={v?.description ?? transaction?.description ?? ""}
          className={inputClass}
        />
        <FieldError errors={state?.errors?.description} />
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

      <label className="block text-sm">
        Note <span className="text-slate-400">(optional)</span>
        <textarea
          name="note"
          rows={3}
          defaultValue={v?.note ?? transaction?.note ?? ""}
          className={inputClass}
        />
        <FieldError errors={state?.errors?.note} />
      </label>

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
          href="/transactions"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
