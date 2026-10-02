import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireRole } from "@/modules/auth/rbac";
import { reviewVerification, reviewAgentVerification, reviewAgencyVerification } from "@/modules/verification/actions";
import { cmsDashboardCounts } from "@/modules/cms/queries";
import { ADMIN_NAV as NAV } from "@/components/dashboard/admin-nav";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const [userCount, listingCount, leadCount, pendingAgents, pendingAgencies, pendingVerifications, recentAuditLogs, cmsCounts] =
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
      cmsDashboardCounts(),
    ]);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Platform overview</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Link href="/admin/dashboard/users">
          <Card className="p-4 transition-shadow hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-sand-500">Users</p>
            <p className="mt-1 text-xl font-semibold text-ink-950">{userCount}</p>
          </Card>
        </Link>
        <Link href="/admin/dashboard/listings">
          <Card className="p-4 transition-shadow hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-sand-500">Listings</p>
            <p className="mt-1 text-xl font-semibold text-ink-950">{listingCount}</p>
          </Card>
        </Link>
        <Link href="/admin/dashboard/leads">
          <Card className="p-4 transition-shadow hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-sand-500">Leads</p>
            <p className="mt-1 text-xl font-semibold text-ink-950">{leadCount}</p>
          </Card>
        </Link>
      </div>

      <h2 className="mt-10 flex items-center justify-between text-lg font-semibold text-ink-950">
        Content
        <Link href="/admin/dashboard/content" className="text-sm font-medium text-bronze-600 hover:text-bronze-500">
          Manage content →
        </Link>
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Draft</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{cmsCounts.draft}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">In review</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{cmsCounts.inReview}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Scheduled</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{cmsCounts.scheduled}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Published</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{cmsCounts.published}</p>
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
              <Link href={`/agencies/${agency.slug}`} className="truncate font-medium text-ink-950 hover:text-bronze-600 hover:underline">
                {agency.name}
              </Link>
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
              <Link href={`/agents/${agent.slug}`} className="truncate font-medium text-ink-950 hover:text-bronze-600 hover:underline">
                {agent.user.name}
              </Link>
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
              {property.listings[0] ? (
                <Link
                  href={`/property/${property.listings[0].id}`}
                  className="truncate font-medium text-ink-950 hover:text-bronze-600 hover:underline"
                >
                  {property.listings[0].title}
                </Link>
              ) : (
                <p className="truncate font-medium text-ink-950">
                  {property.type} in {property.area.name}
                </p>
              )}
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
