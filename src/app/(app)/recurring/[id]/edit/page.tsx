import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateRule } from "@/app/actions/recurring";
import { RecurringForm } from "@/components/RecurringForm";
import { listAccounts } from "@/lib/accounts";
import { listCategories } from "@/lib/categories";
import { verifySession } from "@/lib/dal";
import { today } from "@/lib/dates";
import { getRule } from "@/lib/recurring";
import { isUuid } from "@/lib/transaction-schema";

export const metadata: Metadata = { title: "Edit recurring item · Finance Tracker" };

export default async function EditRecurringPage(props: PageProps<"/recurring/[id]/edit">) {
  const { userId } = await verifySession();
  const { id } = await props.params;
  const rule = isUuid(id) ? await getRule(userId, id) : null;
  if (!rule) notFound();
  const [categories, accounts] = await Promise.all([listCategories(userId), listAccounts(userId)]);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Edit recurring item</h1>
      <RecurringForm
        action={updateRule.bind(null, rule.id)}
        rule={rule}
        categories={categories}
        accounts={accounts}
        defaultDate={today()}
        submitLabel="Save changes"
      />
    </div>
  );
}
