import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/modules/auth/rbac";
import { AGENCY_NAV as NAV } from "@/components/dashboard/agency-nav";

export default async function AgencyDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agentProfile = await db.agent.findUnique({ where: { userId: session.user.id } });
  const agencyId = agentProfile?.agencyId;

  if (!agencyId) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
        <p className="text-sm text-sand-600">No agency is linked to this account yet.</p>
      </DashboardShell>
    );
  }

  const [agency, agents, listings, leads] = await Promise.all([
    db.agency.findUnique({ where: { id: agencyId } }),
    db.agent.findMany({ where: { agencyId }, include: { user: true, _count: { select: { listings: true } } } }),
    db.listing.findMany({
      where: { agencyId },
      include: { property: { include: { area: true } }, agent: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.lead.findMany({
      where: { agent: { agencyId } },
      include: { customer: true, agent: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agency Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">{agency?.name}</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Agents</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{agents.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Listings</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{listings.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Recent leads</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{leads.length}</p>
        </Card>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Agents</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {agents.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-4 text-sm">
            <span className="font-medium text-ink-950">{a.user.name}</span>
            <span className="text-sand-500">{a._count.listings} listings</span>
          </div>
        ))}
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">All listings</h2>
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-sand-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-950">{listing.title}</td>
                <td className="px-4 py-3 text-sand-700">{listing.agent.user.name}</td>
                <td className="px-4 py-3 text-sand-700">{listing.property.area.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={listing.status === "ACTIVE" ? "success" : "neutral"}>{listing.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Recent leads across agents</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {leads.length === 0 && <p className="p-4 text-sm text-sand-600">No leads yet.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
              <p className="text-sand-600">Assigned to {lead.agent?.user.name ?? "unassigned"}</p>
            </div>
            <Badge variant="neutral">{lead.status}</Badge>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
