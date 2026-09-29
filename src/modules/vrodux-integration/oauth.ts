/**
 * Standard OAuth2 authorization-code flow, with Qasro as the authorization server and
 * Vrodux as the (single, hardcoded) client. See docs/ARCHITECTURE.md §7.2 for the full
 * flow. This is deliberately NOT a general multi-client OAuth server — there is exactly
 * one client today (Vrodux), registered via env vars, not a database table. If a second
 * client shows up, promote CLIENT_ID/clientSecret/redirectUri below into a real
 * OAuthClient table.
 */

import crypto from "crypto";
import { db } from "@/lib/db";

export const VRODUX_CLIENT_ID = "vrodux";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getVroduxClientSecret(): string | undefined {
  return process.env.QASRO_VRODUX_CLIENT_SECRET?.trim();
}

export function getVroduxRedirectUri(): string | undefined {
  return process.env.QASRO_VRODUX_REDIRECT_URI;
}

/** Constant-time secret comparison — never use `===` on secrets. */
export function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates a request's `Authorization: Bearer {client_secret}` header. Accepts a
 * case-insensitive "Bearer" scheme and trims whitespace on both the header value and
 * the configured secret — a dashboard-pasted env var or a header built by a different
 * HTTP stack on Vrodux's end is a much more likely source of a silent mismatch here
 * than an actually-wrong secret (see the /api/oauth/token body-based comparison, which
 * uses the exact same env var and is more forgiving by virtue of being JSON, not a
 * header). Logs (never the secret itself) on every failure path so a real mismatch is
 * provable from Vercel function logs instead of guessed at.
 */
export function isValidClientSecretHeader(authHeader: string | null): boolean {
  const expected = getVroduxClientSecret();
  if (!expected) {
    console.warn("[vrodux-oauth] QASRO_VRODUX_CLIENT_SECRET is not set on this deployment.");
    return false;
  }

  if (!authHeader) {
    console.warn("[vrodux-oauth] pull-key/unlink called with no Authorization header.");
    return false;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    console.warn(
      `[vrodux-oauth] Authorization header present but not in "Bearer <token>" form (length ${authHeader.length}).`,
    );
    return false;
  }

  const provided = match[1].trim();
  if (!secretsMatch(provided, expected)) {
    console.warn(
      `[vrodux-oauth] client_secret mismatch on pull-key/unlink. provided length=${provided.length} expected length=${expected.length}`,
    );
    return false;
  }

  return true;
}

/**
 * `redirect_uri` must match exactly what's registered for the client — the standard
 * OAuth anti-redirect-hijack check. No wildcards, no prefix matching (trailing
 * whitespace IS trimmed defensively, since a value pasted into a dashboard env var
 * field is a common source of an invisible mismatch).
 *
 * Logs (never throws) on a mismatch — neither value is secret, so both are safe to log
 * and this is the fastest way to tell "env var unset" apart from "actual mismatch"
 * apart from "Vrodux sent something different" from Vercel's function logs, without
 * guessing.
 */
export function isRegisteredRedirectUri(clientId: string, redirectUri: string): boolean {
  if (clientId !== VRODUX_CLIENT_ID) {
    console.warn(`[vrodux-oauth] unknown client_id: "${clientId}" (expected "${VRODUX_CLIENT_ID}")`);
    return false;
  }

  const registered = getVroduxRedirectUri()?.trim();
  const incoming = redirectUri.trim();

  if (!registered) {
    console.warn(
      "[vrodux-oauth] QASRO_VRODUX_REDIRECT_URI is not set on this deployment — every /oauth/authorize " +
        "request will fail this check until it's set AND the app is redeployed (env var changes in the " +
        "Vercel dashboard don't apply to an already-running deployment).",
    );
    return false;
  }

  if (incoming !== registered) {
    console.warn(
      `[vrodux-oauth] redirect_uri mismatch. incoming="${incoming}" registered="${registered}"`,
    );
    return false;
  }

  return true;
}

/** Appends OAuth response params (code/error/state) to a redirect_uri that's already
 * been validated via isRegisteredRedirectUri — handles a redirect_uri that may or may
 * not already contain a query string. */
export function appendOAuthParams(
  redirectUri: string,
  params: Record<string, string | null | undefined>,
): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function issueAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  userId: string;
  agencyId: string;
  state: string | null;
}): Promise<string> {
  const code = crypto.randomBytes(32).toString("base64url");
  await db.vroduxOAuthCode.create({
    data: {
      code,
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      userId: input.userId,
      agencyId: input.agencyId,
      state: input.state,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

export type ConsumeCodeResult =
  | { ok: true; agencyId: string; userId: string }
  | { ok: false; reason: "invalid_grant" | "invalid_client" };

/**
 * Exchanges a one-time code for the agency it was issued for. Enforces single-use,
 * expiry, and that it's being redeemed by the same client_id + redirect_uri it was
 * issued for. Marks the code used even on a matched-but-expired redemption attempt,
 * so a leaked/replayed code can't be retried.
 */
export async function consumeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
}): Promise<ConsumeCodeResult> {
  const record = await db.vroduxOAuthCode.findUnique({ where: { code: input.code } });

  if (!record || record.clientId !== input.clientId || record.redirectUri !== input.redirectUri) {
    return { ok: false, reason: "invalid_grant" };
  }

  if (record.usedAt) {
    return { ok: false, reason: "invalid_grant" };
  }

  // Mark used regardless of expiry so a retry can never redeem it, expired or not.
  await db.vroduxOAuthCode.update({ where: { code: input.code }, data: { usedAt: new Date() } });

  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "invalid_grant" };
  }

  return { ok: true, agencyId: record.agencyId, userId: record.userId };
}
