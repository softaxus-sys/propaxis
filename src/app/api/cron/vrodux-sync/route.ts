import { NextResponse } from "next/server";
import { syncAllConnectedAgencies } from "@/modules/vrodux-integration/listing-sync";

/**
 * Scheduled Vrodux listing pull — see docs/ARCHITECTURE.md §7.2. Runs once a day via
 * Vercel Cron (vercel.json), which automatically sends `Authorization: Bearer
 * {CRON_SECRET}` when that env var is set — this project has no other job queue/worker
 * infra, so this is the mechanism for now (see docs/ARCHITECTURE.md "Remaining gaps").
 *
 * Once-daily, not the 15–30 min the original spec asked for, because Vercel's Hobby
 * plan caps cron jobs at once per day — a more frequent schedule gets the whole
 * deployment's vercel.json rejected, not just the cron job. If/when this project is on
 * Vercel Pro (or another host without that limit), tighten the schedule in vercel.json.
 *
 * Not on Vercel? Hit this route on your own schedule (cron, GitHub Actions, etc.) with
 * the same bearer token.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllConnectedAgencies();
  const summary = Object.values(results).reduce(
    (acc, r) => ({
      pulled: acc.pulled + r.pulled,
      upserted: acc.upserted + r.upserted,
      delisted: acc.delisted + r.delisted,
    }),
    { pulled: 0, upserted: 0, delisted: 0 },
  );

  return NextResponse.json({ agenciesSynced: Object.keys(results).length, ...summary });
}
