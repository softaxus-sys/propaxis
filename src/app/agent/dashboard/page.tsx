import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAed } from "@/lib/utils";
import { requireRole } from "@/modules/auth/rbac";

const NAV = [
  { href: "/agent/dashboard", label: "Listings" },
  { href: "/agent/dashboard/leads", label: "Leads" },
];

export default async function AgentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agent = await db.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={NAV}>
        <p className="text-sm text-sand-600">
          No agent profile is linked to this account yet. Ask an admin to create one.
        </p>
      </DashboardShell>
    );
  }

  const [listings, leads] = await Promise.all([
    db.listing.findMany({
      where: { agentId: agent.id },
      include: { property: { include: { area: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where: { agentId: agent.id },
      include: { customer: true, listing: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const newLeadCount = leads.filter((l) => l.status === "NEW").length;

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={NAV}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Your listings</h1>
        {agent.isVerified ? (
          <Link href="/agent/dashboard/listings/new">
            <Button size="sm">New listing</Button>
          </Link>
        ) : (
          <Button size="sm" disabled>
            New listing
          </Button>
        )}
      </div>

      {!agent.isVerified && (
        <div className="mt-4 rounded-xl border border-bronze-300 bg-bronze-50 px-4 py-3 text-sm text-bronze-600">
          Your agent profile is pending admin verification. You can explore the dashboard now, but you
          won&apos;t be able to publish listings until it&apos;s approved.
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Total listings</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{listings.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Active</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">New leads</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{newLeadCount}</p>
        </Card>
      </div>

      <Card className="mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-sand-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/property/${listing.id}`} className="font-medium text-ink-950 hover:text-bronze-500">
                    {listing.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sand-700">{listing.property.area.name}</td>
                <td className="px-4 py-3 text-sand-700">
                  {listing.type === "SALE"
                    ? formatAed(Number(listing.askingPriceAed ?? 0), { compact: true })
                    : `${formatAed(Number(listing.askingRentAedYear ?? 0), { compact: true })}/yr`}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={listing.status === "ACTIVE" ? "success" : "neutral"}>{listing.status}</Badge>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sand-500">
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Recent leads</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {leads.length === 0 && <p className="p-4 text-sm text-sand-600">No leads yet.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
              <p className="text-sand-600">{lead.listing?.title ?? "General enquiry"}</p>
            </div>
            <Badge variant="neutral">{lead.status}</Badge>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
