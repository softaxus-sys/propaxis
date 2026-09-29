"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/modules/auth/rbac";
import { issueAuthorizationCode, isRegisteredRedirectUri, VRODUX_CLIENT_ID, appendOAuthParams } from "./oauth";

/**
 * Approve/deny handlers for the /oauth/authorize consent screen (see that page for the
 * full gating logic). Every value arrives via hidden form fields rather than a closure,
 * and is re-validated here rather than trusted from the page render — the same
 * defense-in-depth rule the rest of this codebase applies to server actions (see
 * docs/ARCHITECTURE.md §8): a form POST can be replayed with tampered fields.
 */

function readRedirectUri(formData: FormData): string | null {
  const redirectUri = formData.get("redirectUri");
  return typeof redirectUri === "string" && isRegisteredRedirectUri(VRODUX_CLIENT_ID, redirectUri) ? redirectUri : null;
}

export async function approveVroduxConnection(formData: FormData): Promise<void> {
  const redirectUri = readRedirectUri(formData);
  const state = (formData.get("state") as string | null) || null;
  const agencyId = formData.get("agencyId") as string | null;

  // No verified redirect_uri means there's nowhere safe to send the user back to —
  // this shouldn't happen from the real consent form, only a tampered/replayed submit.
  if (!redirectUri || !agencyId) {
    redirect("/");
  }

  const session = await auth();
  if (!session?.user || !requireRole(session.user.role as never, ["AGENCY_ADMIN", "ADMIN"])) {
    redirect(appendOAuthParams(redirectUri, { error: "access_denied", state }));
  }

  const agent = await db.agent.findUnique({ where: { userId: session.user.id }, include: { agency: true } });
  if (!agent?.agency || agent.agency.id !== agencyId) {
    redirect(appendOAuthParams(redirectUri, { error: "access_denied", state }));
  }
  if (!agent.agency.isVerified) {
    redirect(appendOAuthParams(redirectUri, { error: "agency_not_approved", state }));
  }

  const code = await issueAuthorizationCode({
    clientId: VRODUX_CLIENT_ID,
    redirectUri,
    userId: session.user.id,
    agencyId,
    state,
  });

  redirect(appendOAuthParams(redirectUri, { code, state }));
}

export async function denyVroduxConnection(formData: FormData): Promise<void> {
  const redirectUri = readRedirectUri(formData);
  const state = (formData.get("state") as string | null) || null;

  if (!redirectUri) {
    redirect("/");
  }

  redirect(appendOAuthParams(redirectUri, { error: "access_denied", state }));
}
