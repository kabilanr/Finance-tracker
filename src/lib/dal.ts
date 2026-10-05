import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { readSession } from "./session";

// Every page and action that touches user data goes through here, so a
// request without a valid session never reaches the database.
export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
});

export const getCurrentUser = cache(async () => {
  const { userId } = await verifySession();
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) redirect("/login");
  return user;
});
