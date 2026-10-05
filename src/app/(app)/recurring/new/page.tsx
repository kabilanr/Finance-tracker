import type { Metadata } from "next";
import { createRule } from "@/app/actions/recurring";
import { RecurringForm } from "@/components/RecurringForm";
import { listAccounts } from "@/lib/accounts";
import { listCategories } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { today } from "@/lib/dates";

export const metadata: Metadata = { title: "Add recurring item · Finance Tracker" };

export default async function NewRecurringPage() {
  const { userId } = await verifySession();
  const [categories, accounts] = await Promise.all([listCategories(userId), listAccounts(userId)]);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Add recurring item</h1>
      <RecurringForm
        action={createRule}
        categories={categories}
        accounts={accounts}
        defaultDate={today()}
        submitLabel="Add recurring item"
      />
    </div>
  );
}
