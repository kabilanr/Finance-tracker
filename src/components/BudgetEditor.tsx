"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteBudget, saveBudget, type FormState } from "@/app/actions/budgets";

const inputClass =
  "rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950";
const primaryButton =
  "rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";

export function BudgetRowActions({ id, categoryId, limit }: { id: string; categoryId: string; limit: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveBudget(prev, formData);
    if (result?.ok) setEditing(false);
    return result;
  }, undefined);
  const [deleting, startDelete] = useTransition();

  if (editing) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <input name="amount" inputMode="decimal" defaultValue={limit} aria-label="Monthly limit" className={`${inputClass} w-32`} autoFocus />
        <button type="submit" disabled={pending} className={primaryButton}>
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-600 dark:text-slate-400">
          Cancel
        </button>
        {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }
  return (
    <div className="flex gap-3 text-xs">
      <button type="button" onClick={() => setEditing(true)} className="text-slate-600 hover:underline dark:text-slate-400">
        Edit
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          if (confirm("Remove this budget?")) startDelete(() => deleteBudget(id));
        }}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}

export function AddBudgetForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveBudget(prev, formData);
    if (result?.ok) setFormKey((k) => k + 1);
    return result;
  }, undefined);

  if (categories.length === 0) {
    return <p className="text-sm text-slate-500">Every expense category already has a budget.</p>;
  }
  return (
    <form key={formKey} action={action} className="space-y-2 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <div className="flex flex-wrap gap-2">
        <select name="categoryId" aria-label="Category" className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="amount" inputMode="decimal" placeholder="Monthly limit (₹)" aria-label="Monthly limit" className={`${inputClass} w-44`} />
        <button type="submit" disabled={pending} className={primaryButton}>
          Add budget
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
