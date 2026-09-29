import { NextResponse } from "next/server";
import { syncAllConnectedAgencies } from "@/modules/vrodux-integration/listing-sync";

/**
 * Scheduled Vrodux listing pull — see docs/ARCHITECTURE.md §7.2. Runs every 20 minutes
 * via Vercel Cron (vercel.json), which automatically sends `Authorization: Bearer
 * {CRON_SECRET}` when that env var is set — this project has no other job queue/worker
 * infra, so this is the mechanism for now (see docs/ARCHITECTURE.md "Remaining gaps").
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
