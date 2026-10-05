"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { verifySession } from "@/lib/dal";
import { isUuid } from "@/lib/transaction-schema";

const CategorySchema = z.object({
  type: z.enum(["income", "expense"], { error: "Choose income or expense." }),
  name: z.string().trim().min(1, { error: "Enter a name." }).max(40, { error: "Keep it under 40 characters." }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: "Pick a colour." }),
});

export type CategoryFormState = { error?: string; ok?: boolean } | undefined;

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function parse(formData: FormData) {
  return CategorySchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name") ?? "",
    color: formData.get("color"),
  });
}

export async function createCategory(_state: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const { userId } = await verifySession();
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await db.insert(categories).values({ userId, ...parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `You already have an ${parsed.data.type} category called "${parsed.data.name}".` };
    throw error;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { userId } = await verifySession();
  if (!isUuid(id)) return { error: "This category no longer exists." };
  const parsed = CategorySchema.omit({ type: true }).safeParse({
    name: formData.get("name") ?? "",
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const updated = await db
      .update(categories)
      .set(parsed.data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    if (updated.length === 0) return { error: "This category no longer exists." };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `You already have a category called "${parsed.data.name}".` };
    throw error;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const { userId } = await verifySession();
  if (!isUuid(id)) return;
  // Transactions keep their data; the foreign key sets their category to null.
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/", "layout");
  refresh();
}
