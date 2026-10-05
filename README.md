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

## Modules

- [x] Setup
- [x] Login (email and password)
- [x] Transactions
- [x] Categories
- [ ] Accounts and transfers
- [ ] Budgets
- [ ] Dashboard and charts
- [ ] Recurring entries
- [ ] CSV export
- [ ] Vercel deployment
