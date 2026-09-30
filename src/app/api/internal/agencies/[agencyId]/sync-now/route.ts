import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { isValidClientSecretHeader } from "@/modules/vrodux-integration/oauth";
import { syncAgencyListings } from "@/modules/vrodux-integration/listing-sync";

/**
 * On-demand counterpart to /api/cron/vrodux-sync (docs/ARCHITECTURE.md §7.2) — Vrodux
 * fires this the instant a tenant checks/unchecks "List on Qasro" on a property, so a
 * change doesn't have to wait for the next scheduled pull (once daily on this project's
 * Vercel plan, see that route's comment). Auth is identical to pull-key/unlink: the
 * same shared client_secret, same header check, no new mechanism.
 *
 * `propertyIds` in the body is informational only and intentionally ignored — we just
 * re-run the exact same per-agency resync the cron job calls, which already diffs the
 * agency's full current /properties list against what's synced (handles both a newly
 * published property and a withdrawn one in one pass). A separate "sync just these
 * ids" path would be more code for no real benefit here.
 *
 * Responds 200 immediately and runs the resync in `after()` (Vercel's `waitUntil`
 * under the hood) rather than making Vrodux wait on the upstream fetch — Vrodux treats
 * this as best-effort and won't retry hard on failure, so a slow/failed background
 * resync here just gets picked up by the next scheduled cron run instead.
 */
export async function POST(request: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = await params;

  // Logged unconditionally, before the auth check, so "did Vrodux even call this
  // endpoint" is answerable directly from Vercel's function logs — the auth check
  // below already logs its own failures ([vrodux-oauth]), but a request that never
  // arrives at all is otherwise indistinguishable from a sync that ran fine but found
  // Vrodux's own /properties response not yet updated (see recordPullOutcome/
  // lastPullTrigger for the latter).
  let propertyIdsCount: number | "unknown" = "unknown";
  try {
    const body = (await request.clone().json()) as { propertyIds?: unknown };
    if (Array.isArray(body?.propertyIds)) propertyIdsCount = body.propertyIds.length;
  } catch {
    // Body is informational only — an unparseable/missing body doesn't block anything.
  }
  console.log(`[vrodux-sync-now] request received for agency=${agencyId} propertyIds=${propertyIdsCount}`);

  if (!isValidClientSecretHeader(request.headers.get("authorization"))) {
    return NextResponse.json({ message: "Invalid or missing client credentials." }, { status: 401 });
  }

  const connection = await db.vroduxConnection.findUnique({ where: { agencyId } });
  if (!connection) {
    return NextResponse.json({ message: "Agency is not connected." }, { status: 404 });
  }

  after(async () => {
    try {
      await syncAgencyListings(connection.id, "sync_now");
    } catch (err) {
      // syncAgencyListings already records its own outcome on the connection row and
      // doesn't normally throw — this is just a last-resort safety net.
      console.error(
        `[vrodux-sync-now] unexpected error resyncing agency ${agencyId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
