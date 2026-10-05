import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateTransaction } from "@/app/actions/transactions";
import { TransactionForm } from "@/components/TransactionForm";
import { verifySession } from "@/lib/dal";
import { today } from "@/lib/dates";
import { isUuid } from "@/lib/transaction-schema";
import { getTransaction } from "@/lib/transactions";

export const metadata: Metadata = { title: "Edit transaction · Finance Tracker" };

export default async function EditTransactionPage(props: PageProps<"/transactions/[id]/edit">) {
  const { userId } = await verifySession();
  const { id } = await props.params;
  const transaction = isUuid(id) ? await getTransaction(userId, id) : null;
  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Edit transaction</h1>
      <TransactionForm
        action={updateTransaction.bind(null, transaction.id)}
        transaction={transaction}
        defaultDate={today()}
        submitLabel="Save changes"
      />
    </div>
  );
}
