# Finance Tracker

A personal finance tracker for income, expenses, budgets and accounts.

Built with Next.js (App Router, TypeScript), Tailwind CSS, Drizzle ORM and Postgres (Neon in production). Deploys on Vercel's free plan.

## Getting started

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `SESSION_SECRET` (`openssl rand -base64 32`).
3. Install and run:

   ```bash
   npm install
   npm run db:migrate
   npm run dev
   ```

4. Open http://localhost:3000. Visit `/api/health` to check the database connection.

## Deploying to Vercel (free plan)

1. On [vercel.com](https://vercel.com), choose **Add New → Project** and import this GitHub repository. Keep the detected Next.js settings.
2. In the new project, open **Storage → Create Database → Neon** (free) and connect it to the project. This sets `DATABASE_URL` for you.
3. In **Settings → Environment Variables**, add:
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 32`)
   - `CRON_SECRET`: another long random string, used by the daily recurring-entries job
4. Redeploy (**Deployments → ⋯ → Redeploy**). The build applies database migrations automatically (`npm run vercel-build`).
5. Open the site, visit `/api/health` to confirm the database is connected, then sign up.

A daily Vercel Cron job (`vercel.json`) calls `/api/cron/recurring` to add recurring entries even on days you don't open the app.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run typecheck` | Type-check |
| `npm run db:generate` | Generate a migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Browse the database |
| `npm run vercel-build` | Apply migrations, then build (used by Vercel) |

## Modules

- [x] Setup
- [x] Login (email and password)
- [x] Transactions
- [x] Categories
- [x] Accounts and transfers
- [x] Budgets
- [x] Dashboard and charts
- [x] Recurring entries
- [x] CSV export
- [ ] Vercel deployment (steps above)
