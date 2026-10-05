"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/app/actions/transactions";

export function DeleteTransactionButton({ id, description }: { id: string; description: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete "${description}"?`)) startTransition(() => deleteTransaction(id));
      }}
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
