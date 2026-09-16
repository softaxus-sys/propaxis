import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { requireRole } from "@/modules/auth/rbac";
import { getPipelineForAgent } from "@/modules/opportunities/queries";
import { AGENT_NAV as NAV } from "@/components/dashboard/agent-nav";

export default async function AgentPipelinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agent = await db.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={NAV}>
        <p className="text-sm text-sand-600">No agent profile is linked to this account yet.</p>
      </DashboardShell>
    );
  }

  const { leadsWithoutOpportunity, byStage } = await getPipelineForAgent(agent.id);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Pipeline</h1>
      <p className="mt-1 text-sm text-sand-600">
        Move leads through opportunities and close them into deals.
      </p>
      <div className="mt-6">
        <PipelineBoard leadsWithoutOpportunity={leadsWithoutOpportunity} byStage={byStage} />
      </div>
    </DashboardShell>
  );
}
