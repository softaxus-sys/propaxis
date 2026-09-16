import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { requireRole } from "@/modules/auth/rbac";
import { getPipelineForAgency } from "@/modules/opportunities/queries";
import { AGENCY_NAV as NAV } from "@/components/dashboard/agency-nav";

export default async function AgencyPipelinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agentProfile = await db.agent.findUnique({ where: { userId: session.user.id } });
  if (!agentProfile?.agencyId) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
        <p className="text-sm text-sand-600">No agency is linked to this account yet.</p>
      </DashboardShell>
    );
  }

  const { leadsWithoutOpportunity, byStage } = await getPipelineForAgency(agentProfile.agencyId);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Pipeline</h1>
      <p className="mt-1 text-sm text-sand-600">Opportunities and deals across all agents in your agency.</p>
      <div className="mt-6">
        <PipelineBoard leadsWithoutOpportunity={leadsWithoutOpportunity} byStage={byStage} showAgentName />
      </div>
    </DashboardShell>
  );
}
