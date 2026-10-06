import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  // prepare: false keeps this compatible with Neon's pooled connection string.
  return drizzle(postgres(process.env.DATABASE_URL, { prepare: false }), { schema });
}

type Db = ReturnType<typeof createDb>;
let instance: Db | undefined;

// Connects on first use rather than at import, so `next build` can load the
// app's modules without database credentials (Vercel builds before env vars
// are always in place), while a missing DATABASE_URL still fails loudly at runtime.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
