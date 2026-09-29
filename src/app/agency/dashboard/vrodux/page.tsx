import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConnectVroduxForm } from "@/components/dashboard/connect-vrodux-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/modules/auth/rbac";
import { disconnectVrodux } from "@/modules/agencies/vrodux-actions";
import { AGENCY_NAV as NAV } from "@/components/dashboard/agency-nav";

export default async function AgencyVroduxPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agentProfile = await db.agent.findUnique({ where: { userId: session.user.id } });
  const agency = agentProfile?.agencyId ? await db.agency.findUnique({ where: { id: agentProfile.agencyId } }) : null;

  if (!agency) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
        <p className="text-sm text-sand-600">No agency is linked to this account yet.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">VRODUX integration</h1>
      <p className="mt-1 max-w-xl text-sm text-sand-600">
        Each agency on Qasro connects its own VRODUX tenant independently — this has no connection to
        any other business&apos;s VRODUX account.
      </p>

      <div className="mt-6 space-y-4">
        {agency.vroduxTrialStatus === "PROVISIONING" && (
          <Card className="max-w-md space-y-1 p-6">
            <p className="text-sm text-ink-950">Setting up your VRODUX trial…</p>
            <p className="text-xs text-sand-500">This usually only takes a moment. Refresh to check.</p>
          </Card>
        )}

        {agency.vroduxTrialStatus === "FAILED" && (
          <Card className="max-w-md space-y-1 p-6">
            <p className="text-sm text-danger">We couldn&apos;t set up your VRODUX trial automatically.</p>
            <p className="text-xs text-sand-500">
              You can still connect an existing VRODUX tenant below, or contact support.
            </p>
          </Card>
        )}

        {agency.vroduxWebhookUrl ? (
          <Card className="max-w-md space-y-4 p-6">
            <p className="text-sm text-ink-950">
              {agency.vroduxTrialStatus === "ACTIVE" ? "VRODUX trial connected" : "VRODUX webhook connected"}
            </p>
            <p className="break-all rounded-lg bg-sand-50 px-3 py-2 text-xs text-sand-600">
              {agency.vroduxWebhookUrl}
            </p>
            <p className="text-xs text-sand-500">
              Connected {agency.vroduxConnectedAt?.toLocaleString() ?? ""}
            </p>
            {agency.vroduxTrialStatus === "ACTIVE" && agency.vroduxTrialEndsAt && (
              <p className="text-xs text-sand-500">
                Trial ends {agency.vroduxTrialEndsAt.toLocaleDateString()} — connect your own tenant below anytime
                to keep using VRODUX after that.
              </p>
            )}
            <form action={disconnectVrodux}>
              <input type="hidden" name="agencyId" value={agency.id} />
              <Button type="submit" variant="outline" size="sm">
                Disconnect
              </Button>
            </form>
          </Card>
        ) : (
          agency.vroduxTrialStatus !== "PROVISIONING" && <ConnectVroduxForm />
        )}
      </div>
    </DashboardShell>
  );
}
