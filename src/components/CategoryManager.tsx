"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryFormState,
} from "@/app/actions/categories";
import type { TransactionType } from "@/db/schema";
import { CATEGORY_COLORS } from "@/lib/default-categories";

type Category = { id: string; type: TransactionType; name: string; color: string; transactionCount: number };

const inputClass =
  "rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700";

function ColorPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((c) => (
        <label key={c} className="cursor-pointer">
          <input type="radio" name={name} value={c} defaultChecked={c === defaultValue} className="peer sr-only" />
          <span
            className="block size-6 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-900 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 dark:ring-offset-slate-950 dark:peer-checked:ring-slate-100"
            style={{ backgroundColor: c }}
            title={c}
          />
        </label>
      ))}
    </div>
  );
}

function AddCategoryForm({ type }: { type: TransactionType }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(async (prev, formData) => {
    const result = await createCategory(prev, formData);
    if (result?.ok) setFormKey((k) => k + 1); // remount to clear the form
    return result;
  }, undefined);

  return (
    <form key={formKey} action={action} className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
      <input type="hidden" name="type" value={type} />
      <div className="flex gap-2">
        <input name="name" placeholder={`New ${type} category`} className={`${inputClass} flex-1`} aria-label="Category name" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Add
        </button>
      </div>
      <ColorPicker name="color" defaultValue={CATEGORY_COLORS[formKey % CATEGORY_COLORS.length]} />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(async (prev, formData) => {
    const result = await updateCategory(category.id, prev, formData);
    if (result?.ok) setEditing(false);
    return result;
  }, undefined);
  const [deleting, startDelete] = useTransition();

  if (editing) {
    return (
      <li className="space-y-2 px-4 py-3">
        <form action={action} className="space-y-2">
          <div className="flex gap-2">
            <input name="name" defaultValue={category.name} className={`${inputClass} flex-1`} aria-label="Category name" autoFocus />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md px-2 text-sm text-slate-600 dark:text-slate-400">
              Cancel
            </button>
          </div>
          <ColorPicker name="color" defaultValue={category.color} />
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </li>
    );
  }

  const count = category.transactionCount;
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="truncate">{category.name}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <Link
          href={`/transactions?month=all&category=${category.id}`}
          className="text-xs text-slate-500 hover:underline"
        >
          {count} {count === 1 ? "entry" : "entries"}
        </Link>
        <button type="button" onClick={() => setEditing(true)} className="text-slate-600 hover:underline dark:text-slate-400">
          Edit
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            const note = count > 0 ? ` Its ${count} ${count === 1 ? "entry" : "entries"} will become Uncategorized.` : "";
            if (confirm(`Delete "${category.name}"?${note}`)) startDelete(() => deleteCategory(category.id));
          }}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </span>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(["expense", "income"] as const).map((type) => {
        const list = categories.filter((c) => c.type === type);
        return (
          <section key={type} className="space-y-3">
            <h2 className="font-semibold">{type === "expense" ? "Expense categories" : "Income categories"}</h2>
            {list.length > 0 && (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {list.map((c) => (
                  <CategoryRow key={c.id} category={c} />
                ))}
              </ul>
            )}
            <AddCategoryForm type={type} />
          </section>
        );
      })}
    </div>
  );
}
