import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidClientSecretHeader } from "@/modules/vrodux-integration/oauth";

/**
 * Step 7 of docs/ARCHITECTURE.md §7.2 — Vrodux calls this best-effort when an agency
 * disconnects from their side, or deletes the Qasro pull key. Stops future listing
 * pulls; deliberately leaves already-synced listings in place (delisting live listings
 * is a bigger decision than an unlink call should make silently — an admin/agency can
 * remove them manually if needed).
 */
export async function POST(request: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  if (!isValidClientSecretHeader(request.headers.get("authorization"))) {
    return NextResponse.json({ message: "Invalid or missing client credentials." }, { status: 401 });
  }

  const { agencyId } = await params;

  const connection = await db.vroduxConnection.findUnique({ where: { agencyId } });
  if (!connection) {
    // Nothing to unlink — treat as success, matching the "best-effort" contract.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await db.vroduxConnection.update({
    where: { agencyId },
    data: { status: "DISCONNECTED", disconnectedAt: new Date(), apiKey: null },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
