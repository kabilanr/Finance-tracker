"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AuthFormState, LoginSchema, SignupSchema } from "@/lib/auth-schemas";
import { seedDefaultCategories } from "@/lib/categories";
import { createSession, deleteSession } from "@/lib/session";

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = SignupSchema.safeParse({ ...values, password: formData.get("password") });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, password } = parsed.data;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] }, values };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning({ id: users.id });
  await seedDefaultCategories(user.id);

  await createSession(user.id);
  redirect("/");
}

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = LoginSchema.safeParse({ ...values, password: formData.get("password") });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return { message: "Incorrect email or password.", values };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
