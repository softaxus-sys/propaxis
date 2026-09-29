import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidClientSecretHeader } from "@/modules/vrodux-integration/oauth";

/**
 * Step 6 of docs/ARCHITECTURE.md §7.2 — called by Vrodux's backend immediately after a
 * successful /api/oauth/token exchange, handing Qasro the credential it will use to
 * pull that agency's listings. Idempotent by design (upsert on agencyId): reconnecting
 * or rotating the key just overwrites what's stored.
 */
export async function POST(request: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  if (!isValidClientSecretHeader(request.headers.get("authorization"))) {
    return NextResponse.json({ message: "Invalid or missing client credentials." }, { status: 401 });
  }

  const { agencyId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const { apiKey, listingsApiBaseUrl } = (body ?? {}) as Record<string, unknown>;
  if (typeof apiKey !== "string" || !apiKey || typeof listingsApiBaseUrl !== "string" || !listingsApiBaseUrl) {
    return NextResponse.json({ message: "apiKey and listingsApiBaseUrl are required." }, { status: 400 });
  }

  const agency = await db.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    return NextResponse.json({ message: "Unknown agencyId." }, { status: 404 });
  }

  await db.vroduxConnection.upsert({
    where: { agencyId },
    create: {
      agencyId,
      apiKey,
      listingsApiBaseUrl,
      status: "CONNECTED",
      connectedAt: new Date(),
    },
    update: {
      apiKey,
      listingsApiBaseUrl,
      status: "CONNECTED",
      connectedAt: new Date(),
      disconnectedAt: null,
      reconnectNeeded: false,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
