import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { LeadStatusSelect } from "@/components/dashboard/lead-status-select";
import { requireRole } from "@/modules/auth/rbac";
import { AGENT_NAV as NAV } from "@/components/dashboard/agent-nav";

export default async function AgentLeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agent = await db.agent.findUnique({ where: { userId: session.user.id } });
  const leads = agent
    ? await db.lead.findMany({
        where: { agentId: agent.id },
        include: { customer: true, listing: true, project: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Leads</h1>

      <Card className="mt-6 divide-y divide-sand-100">
        {leads.length === 0 && <p className="p-4 text-sm text-sand-600">No leads yet.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
              <p className="truncate text-sm text-sand-600">
                {lead.listing?.title ?? lead.project?.name ?? "General enquiry"}
              </p>
              {lead.message && <p className="mt-1 truncate text-xs text-sand-500">&ldquo;{lead.message}&rdquo;</p>}
            </div>
            <LeadStatusSelect leadId={lead.id} status={lead.status} />
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
