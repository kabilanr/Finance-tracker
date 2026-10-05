import { generateDueTransactions } from "@/lib/recurring";

// Called once a day by Vercel Cron (see vercel.json) so recurring entries are
// created even on days nobody opens the app. Vercel sends CRON_SECRET as a
// bearer token; without the secret configured the route stays closed.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const created = await generateDueTransactions();
  return Response.json({ ok: true, created });
}
