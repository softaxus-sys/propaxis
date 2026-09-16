import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLE_REDIRECT: Record<string, string> = {
  AGENT: "/agent/dashboard",
  AGENCY_ADMIN: "/agency/dashboard",
  DEVELOPER: "/developer/dashboard",
  ADMIN: "/admin/dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const redirectTo = ROLE_REDIRECT[session.user.role];
  if (redirectTo) redirect(redirectTo);

  const [savedProperties, savedSearches, leads] = await Promise.all([
    db.savedProperty.findMany({
      where: { userId: session.user.id },
      include: { property: { include: { area: true, listings: { take: 1, orderBy: { publishedAt: "desc" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.savedSearch.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    db.lead.findMany({
      where: { customerId: session.user.id },
      include: { listing: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <DashboardShell userName={session.user.name ?? session.user.email ?? "You"} roleLabel="Buyer / Tenant" nav={[
      { href: "/dashboard", label: "Overview" },
      { href: "/buy", label: "Browse" },
    ]}>
      <h1 className="text-2xl font-semibold text-ink-950">Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-ink-950">Saved properties ({savedProperties.length})</h2>
          {savedProperties.length === 0 ? (
            <p className="mt-3 text-sm text-sand-600">
              Nothing saved yet. <Link href="/buy" className="underline underline-offset-4">Browse listings →</Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-sand-100">
              {savedProperties.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/property/${s.property.listings[0]?.id ?? s.propertyId}`} className="text-ink-950 hover:text-bronze-500">
                    {s.property.area.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink-950">Saved searches ({savedSearches.length})</h2>
          {savedSearches.length === 0 ? (
            <p className="mt-3 text-sm text-sand-600">No saved searches yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-sand-100">
              {savedSearches.map((s) => (
                <li key={s.id} className="py-3 text-sm text-ink-950">
                  {s.name} {s.alertsOn && <span className="text-xs text-success">· alerts on</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink-950">Your enquiries ({leads.length})</h2>
          {leads.length === 0 ? (
            <p className="mt-3 text-sm text-sand-600">You haven&apos;t contacted any agents yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-sand-100">
              {leads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-ink-950">{lead.listing?.title ?? lead.project?.name ?? "General enquiry"}</span>
                  <span className="text-xs text-sand-500">{lead.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-center">
        <p className="text-sm text-sand-600">Want to list a property or work with clients?</p>
        <Link href="/for-professionals" className="mt-3 inline-block">
          <Button variant="outline" size="sm">Learn about PropAxis for professionals</Button>
        </Link>
      </div>
    </DashboardShell>
  );
}
