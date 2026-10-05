import type { Metadata } from "next";
import { CategoryManager } from "@/components/CategoryManager";
import { listCategoriesWithCounts } from "@/lib/categories";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Categories · Finance Tracker" };

export default async function CategoriesPage() {
  const { userId } = await verifySession();
  const categories = await listCategoriesWithCounts(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-slate-500">Group your income and expenses. Deleting a category keeps its entries.</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
