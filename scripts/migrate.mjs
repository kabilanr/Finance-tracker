// Applies database migrations during the Vercel build (see "vercel-build" in
// package.json). Skips with a warning when no database is configured yet, so
// the first deploy still builds and the app can explain what's missing.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Neon's direct (unpooled) connection is preferred for migrations.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.warn("No DATABASE_URL set: skipping database migrations.");
  process.exit(0);
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
