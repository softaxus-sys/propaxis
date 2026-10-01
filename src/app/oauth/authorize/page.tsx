import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/modules/auth/rbac";
import { isRegisteredRedirectUri, appendOAuthParams } from "@/modules/vrodux-integration/oauth";
import { approveVroduxConnection, denyVroduxConnection } from "@/modules/vrodux-integration/oauth-actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The one and only screen a human sees in the Vrodux↔Qasro OAuth flow — everything
 * else (token exchange, pull-key, unlink) is server-to-server. See
 * docs/ARCHITECTURE.md §7.2 for the full flow this page is step 2–4 of.
 */
export default async function VroduxAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{
    client_id?: string;
    redirect_uri?: string;
    state?: string;
    company_name?: string;
  }>;
}) {
  const { client_id, redirect_uri, state, company_name } = await searchParams;

  // redirect_uri isn't trustworthy until it's matched against what's registered for
  // client_id — until then there is nowhere safe to send the user back to, so this is
  // a local error page, never a redirect. (Standard OAuth anti-redirect-hijack check.)
  if (!client_id || !redirect_uri || !isRegisteredRedirectUri(client_id, redirect_uri)) {
    // Nothing here actually expires on this page (the only code/expiry check is later,
    // at token exchange) — this is a client_id/redirect_uri mismatch, most often an
    // unset or stale QASRO_VRODUX_REDIRECT_URI. See the [vrodux-oauth] warning this
    // logs server-side (isRegisteredRedirectUri) for exactly which check failed.
    return (
      <Shell>
        <p className="text-sm text-danger">
          This connection request couldn&apos;t be verified. Please restart it from Vrodux, or contact
          Qasro support if this keeps happening.
        </p>
      </Shell>
    );
  }

  const here = `/oauth/authorize?${new URLSearchParams({
    client_id,
    redirect_uri,
    ...(state ? { state } : {}),
    ...(company_name ? { company_name } : {}),
  }).toString()}`;

  const session = await auth();

  if (!session?.user) {
    return (
      <Shell>
        <p className="text-sm text-sand-600">
          {company_name ? `${company_name} wants to c` : "C"}onnect Vrodux to your Qasro agency account. Log in
          or create one to continue.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/login?callbackUrl=${encodeURIComponent(here)}`}>
            <Button className="w-full">Log in to Qasro</Button>
          </Link>
          <Link
            href={`/register?type=agency&agencyName=${encodeURIComponent(company_name ?? "")}&callbackUrl=${encodeURIComponent(here)}`}
          >
            <Button variant="outline" className="w-full">
              Create an agency account
            </Button>
          </Link>
        </div>
        <CancelLink redirectUri={redirect_uri} state={state} reason="login_required" />
      </Shell>
    );
  }

  if (!requireRole(session.user.role as never, ["AGENCY_ADMIN", "ADMIN"])) {
    return (
      <Shell>
        <p className="text-sm text-sand-600">
          This Qasro account can&apos;t connect Vrodux — sign in with your agency&apos;s admin account instead.
        </p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(here)}`} className="mt-6 block">
          <Button className="w-full">Switch account</Button>
        </Link>
        <CancelLink redirectUri={redirect_uri} state={state} reason="access_denied" />
      </Shell>
    );
  }

  const agent = await db.agent.findUnique({ where: { userId: session.user.id }, include: { agency: true } });

  if (!agent?.agency) {
    return (
      <Shell>
        <p className="text-sm text-sand-600">
          This Qasro account isn&apos;t linked to an agency yet. Register your agency on Qasro first, then
          restart this connection from Vrodux.
        </p>
        <Link href="/register?type=agency" className="mt-6 block">
          <Button variant="outline" className="w-full">
            Register an agency
          </Button>
        </Link>
        <CancelLink redirectUri={redirect_uri} state={state} reason="no_agency" />
      </Shell>
    );
  }

  if (!agent.agency.isVerified) {
    return (
      <Shell>
        <p className="text-sm text-sand-600">
          Your agency, <span className="font-medium text-ink-950">{agent.agency.name}</span>, is pending
          approval on Qasro. You can connect Vrodux once it&apos;s approved.
        </p>
        <CancelLink redirectUri={redirect_uri} state={state} reason="agency_not_approved" />
      </Shell>
    );
  }

  return (
    <Shell title={`Connect ${agent.agency.name} to Vrodux`}>
      <p className="text-sm text-sand-600">
        Vrodux will be able to publish the properties you choose, from your Vrodux tenant, as live
        listings on Qasro. You can disconnect anytime from either Vrodux or your Qasro dashboard.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <form action={approveVroduxConnection}>
          <input type="hidden" name="redirectUri" value={redirect_uri} />
          <input type="hidden" name="state" value={state ?? ""} />
          <input type="hidden" name="agencyId" value={agent.agency.id} />
          <Button type="submit" className="w-full">
            Connect
          </Button>
        </form>
        <form action={denyVroduxConnection}>
          <input type="hidden" name="redirectUri" value={redirect_uri} />
          <input type="hidden" name="state" value={state ?? ""} />
          <Button type="submit" variant="outline" className="w-full">
            Cancel
          </Button>
        </form>
      </div>
    </Shell>
  );
}

function CancelLink({
  redirectUri,
  state,
  reason,
}: {
  redirectUri: string;
  state: string | undefined;
  reason: string;
}) {
  return (
    <a
      href={appendOAuthParams(redirectUri, { error: reason, state })}
      className="mt-4 block text-center text-sm text-sand-500 underline underline-offset-4"
    >
      Back to Vrodux
    </a>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8">
          <h1 className="text-xl font-semibold text-ink-950">{title ?? "Connect Vrodux"}</h1>
          <div className="mt-3">{children}</div>
        </Card>
      </div>
    </main>
  );
}
