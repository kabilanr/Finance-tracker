import type { Metadata } from "next";
import { createTransaction } from "@/app/actions/transactions";
import { TransactionForm } from "@/components/TransactionForm";
import { today } from "@/lib/dates";

export const metadata: Metadata = { title: "Add transaction · Finance Tracker" };

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Add transaction</h1>
      <TransactionForm action={createTransaction} defaultDate={today()} submitLabel="Add transaction" />
    </div>
  );
}
