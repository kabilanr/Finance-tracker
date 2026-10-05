import type { Metadata } from "next";
import { createTransaction } from "@/app/actions/transactions";
import { TransactionForm } from "@/components/TransactionForm";
import { listCategories } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { today } from "@/lib/dates";

export const metadata: Metadata = { title: "Add transaction · Finance Tracker" };

export default async function NewTransactionPage() {
  const { userId } = await verifySession();
  const categories = await listCategories(userId);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Add transaction</h1>
      <TransactionForm action={createTransaction} categories={categories} defaultDate={today()} submitLabel="Add transaction" />
    </div>
  );
}
