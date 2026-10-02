import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { LeadStatusSelect } from "@/components/dashboard/lead-status-select";
import { requireRole } from "@/modules/auth/rbac";
import { ADMIN_NAV as NAV } from "@/components/dashboard/admin-nav";

/** Platform-wide — every lead, not just one agent's (see src/app/agent/dashboard/leads
 * for the per-agent equivalent this mirrors). updateLeadStatus already allows ADMIN to
 * change any lead's status (see src/modules/leads/actions.ts) — this page was just
 * missing a place to find them from. */
export default async function AdminLeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const leads = await db.lead.findMany({
    include: { customer: true, listing: true, project: true, agent: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">All leads ({leads.length})</h1>

      <Card className="mt-6 divide-y divide-sand-100">
        {leads.length === 0 && <p className="p-4 text-sm text-sand-600">No leads yet.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
              <p className="truncate text-sm text-sand-600">
                {lead.listing ? (
                  <Link href={`/property/${lead.listing.id}`} className="hover:text-bronze-600 hover:underline">
                    {lead.listing.title}
                  </Link>
                ) : (
                  (lead.project?.name ?? "General enquiry")
                )}
                {" · "}
                {lead.agent ? (lead.agent.user.name ?? lead.agent.user.email) : "Unassigned"}
                {" · "}
                {lead.source.replaceAll("_", " ")}
              </p>
              {lead.message && <p className="mt-1 truncate text-xs text-sand-500">&ldquo;{lead.message}&rdquo;</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-sand-400">{lead.createdAt.toLocaleDateString()}</span>
              <LeadStatusSelect leadId={lead.id} status={lead.status} />
            </div>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
