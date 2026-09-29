import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  VRODUX_CLIENT_ID,
  consumeAuthorizationCode,
  getVroduxClientSecret,
  isRegisteredRedirectUri,
  secretsMatch,
} from "@/modules/vrodux-integration/oauth";

/**
 * Step 5 of docs/ARCHITECTURE.md §7.2 — Vrodux's backend (never the browser) exchanges
 * the authorization code from /oauth/authorize for confirmation of which Qasro agency
 * connected. Standard OAuth2 authorization_code grant, one client (Vrodux) only.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const { grant_type, code, redirect_uri, client_id, client_secret } = body as Record<string, unknown>;

  if (
    grant_type !== "authorization_code" ||
    typeof code !== "string" ||
    typeof redirect_uri !== "string" ||
    typeof client_id !== "string" ||
    typeof client_secret !== "string"
  ) {
    return NextResponse.json({ message: "Missing or invalid required fields." }, { status: 400 });
  }

  const expectedSecret = getVroduxClientSecret();
  if (client_id !== VRODUX_CLIENT_ID || !expectedSecret || !secretsMatch(client_secret, expectedSecret)) {
    return NextResponse.json({ message: "Invalid client credentials." }, { status: 401 });
  }

  if (!isRegisteredRedirectUri(client_id, redirect_uri)) {
    return NextResponse.json({ message: "redirect_uri does not match the registered value." }, { status: 400 });
  }

  const result = await consumeAuthorizationCode({ code, clientId: client_id, redirectUri: redirect_uri });
  if (!result.ok) {
    return NextResponse.json({ message: "Invalid, expired, or already-used authorization code." }, { status: 400 });
  }

  const agency = await db.agency.findUnique({ where: { id: result.agencyId } });
  if (!agency) {
    return NextResponse.json({ message: "Agency no longer exists." }, { status: 400 });
  }

  if (!agency.isVerified) {
    return NextResponse.json(
      { message: `${agency.name} is still pending approval on Qasro — try reconnecting once it's approved.` },
      { status: 403 },
    );
  }

  return NextResponse.json({ agencyId: agency.id }, { status: 200 });
}
