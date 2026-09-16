import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/modules/auth/rbac";
import { reviewVerification, reviewAgentVerification, reviewAgencyVerification } from "@/modules/verification/actions";

const NAV = [{ href: "/admin/dashboard", label: "Overview" }];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const [userCount, listingCount, leadCount, pendingAgents, pendingAgencies, pendingVerifications, recentAuditLogs] =
    await Promise.all([
      db.user.count(),
      db.listing.count(),
      db.lead.count(),
      db.agent.findMany({
        where: { isVerified: false },
        include: { user: true, agency: true },
        orderBy: { createdAt: "desc" },
      }),
      db.agency.findMany({
        where: { isVerified: false },
        include: { _count: { select: { agents: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.property.findMany({
        where: { OR: [{ verification: null }, { verification: { status: { in: ["UNVERIFIED", "PENDING"] } } }] },
        include: { area: true, listings: { take: 1, orderBy: { publishedAt: "desc" } }, verification: true },
        take: 20,
      }),
      db.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Platform overview</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Users</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{userCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Listings</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{listingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Leads</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{leadCount}</p>
        </Card>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">
        Agent &amp; agency verification ({pendingAgents.length + pendingAgencies.length})
      </h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {pendingAgents.length === 0 && pendingAgencies.length === 0 && (
          <p className="p-4 text-sm text-sand-600">Nothing pending review.</p>
        )}
        {pendingAgencies.map((agency) => (
          <div key={agency.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">{agency.name}</p>
              <p className="text-sand-500">
                Agency · RERA/DED: {agency.ridNumber ?? "—"} · {agency._count.agents} agent(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Pending</Badge>
              <form action={reviewAgencyVerification}>
                <input type="hidden" name="agencyId" value={agency.id} />
                <input type="hidden" name="decision" value="true" />
                <Button type="submit" size="sm" variant="outline">
                  Verify
                </Button>
              </form>
              <form action={reviewAgencyVerification}>
                <input type="hidden" name="agencyId" value={agency.id} />
                <input type="hidden" name="decision" value="false" />
                <Button type="submit" size="sm" variant="ghost">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
        {pendingAgents.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">{agent.user.name}</p>
              <p className="text-sand-500">
                Agent · RERA: {agent.ridNumber ?? "—"} · {agent.agency?.name ?? "No agency"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Pending</Badge>
              <form action={reviewAgentVerification}>
                <input type="hidden" name="agentId" value={agent.id} />
                <input type="hidden" name="decision" value="true" />
                <Button type="submit" size="sm" variant="outline">
                  Verify
                </Button>
              </form>
              <form action={reviewAgentVerification}>
                <input type="hidden" name="agentId" value={agent.id} />
                <input type="hidden" name="decision" value="false" />
                <Button type="submit" size="sm" variant="ghost">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">
        Property verification queue ({pendingVerifications.length})
      </h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {pendingVerifications.length === 0 && <p className="p-4 text-sm text-sand-600">Nothing pending review.</p>}
        {pendingVerifications.map((property) => (
          <div key={property.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">
                {property.listings[0]?.title ?? `${property.type} in ${property.area.name}`}
              </p>
              <p className="text-sand-500">{property.area.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{property.verification?.status ?? "UNVERIFIED"}</Badge>
              <form action={reviewVerification}>
                <input type="hidden" name="propertyId" value={property.id} />
                <input type="hidden" name="decision" value="VERIFIED" />
                <Button type="submit" size="sm" variant="outline">
                  Verify
                </Button>
              </form>
              <form action={reviewVerification}>
                <input type="hidden" name="propertyId" value={property.id} />
                <input type="hidden" name="decision" value="REJECTED" />
                <Button type="submit" size="sm" variant="ghost">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Recent activity</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {recentAuditLogs.length === 0 && <p className="p-4 text-sm text-sand-600">No activity recorded yet.</p>}
        {recentAuditLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 text-sm">
            <span className="text-ink-950">
              {log.user?.name ?? "System"} — {log.action}
            </span>
            <span className="text-xs text-sand-500">{log.createdAt.toLocaleString()}</span>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
