import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Commercial" };

export default async function CommercialPage() {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", property: { type: { in: ["OFFICE", "RETAIL", "WAREHOUSE"] } } },
    include: { property: { include: { area: true, building: true } }, agent: { include: { user: true } }, agency: true },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">Commercial properties</h1>
          <p className="mt-1 text-sm text-sand-600">Offices, retail and warehouse space across the UAE.</p>

          {listings.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
              <p className="text-sand-600">No commercial listings yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
