import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { requireRole } from "@/modules/auth/rbac";
import { ADMIN_NAV as NAV } from "@/components/dashboard/admin-nav";

/** Platform-wide — every listing, not just one agent's. Admins already have edit
 * rights on any listing (see the isAdmin bypass in updateListing/updateListingStatus
 * and the edit page's own ownership check), this was just missing a place to find
 * them from; see docs/ARCHITECTURE.md. */
export default async function AdminListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const listings = await db.listing.findMany({
    include: {
      property: { include: { area: true } },
      agent: { include: { user: true } },
      agency: true,
      vroduxSync: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">All listings ({listings.length})</h1>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Agent / Agency</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
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
                <td className="px-4 py-3 text-sand-700">
                  {listing.agent.user.name ?? listing.agent.user.email}
                  {listing.agency && <span className="text-sand-500"> · {listing.agency.name}</span>}
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
                <td className="px-4 py-3 text-right">
                  {listing.vroduxSync ? (
                    <span className="text-xs text-sand-400">Synced from Vrodux</span>
                  ) : (
                    <Link
                      href={`/agent/dashboard/listings/${listing.id}`}
                      className="text-sm font-medium text-bronze-600 hover:text-bronze-700"
                    >
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sand-500">
                  No listings on the platform yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
