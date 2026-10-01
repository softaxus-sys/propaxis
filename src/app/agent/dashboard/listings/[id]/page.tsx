import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EditListingForm } from "@/components/dashboard/edit-listing-form";
import { requireRole } from "@/modules/auth/rbac";
import { AGENT_NAV } from "@/components/dashboard/agent-nav";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agent = await db.agent.findUnique({ where: { userId: session.user.id } });

  const [listing, areas] = await Promise.all([
    db.listing.findUnique({ where: { id }, include: { property: true, vroduxSync: true } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!listing) notFound();

  const isOwner = agent?.id === listing.agentId;
  const isAgencyAdmin = session.user.role === "AGENCY_ADMIN" && agent?.agencyId === listing.agencyId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAgencyAdmin && !isAdmin) redirect("/agent/dashboard");

  // Vrodux-synced listings are managed on the Vrodux side and re-overwritten on every
  // sync — editing them here would silently get clobbered on the next pull.
  if (listing.vroduxSync) {
    redirect("/agent/dashboard");
  }

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Agent" nav={AGENT_NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">Edit listing</h1>
      <div className="mt-6 max-w-xl">
        <EditListingForm
          listing={{
            id: listing.id,
            title: listing.title,
            description: listing.description,
            type: listing.type,
            propertyType: listing.property.type,
            areaId: listing.property.areaId,
            bedrooms: listing.property.bedrooms ?? 0,
            bathrooms: listing.property.bathrooms ?? 0,
            areaSqft: listing.property.areaSqft,
            askingPriceAed: listing.askingPriceAed ? Number(listing.askingPriceAed) : null,
            askingRentAedYear: listing.askingRentAedYear ? Number(listing.askingRentAedYear) : null,
            images: listing.images,
          }}
          areas={areas.map((a) => ({ id: a.id, name: a.name }))}
        />
      </div>
    </DashboardShell>
  );
}
