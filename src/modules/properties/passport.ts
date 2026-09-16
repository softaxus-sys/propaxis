import { db } from "@/lib/db";

/**
 * Assembles the "Property Passport" — everything PropAxis knows about a listing's
 * underlying property: the active listing, comparable listings in the same area,
 * transaction/rental history, and the latest area market metric. This is the single
 * read path both the property detail page and the AI `getPropertyPassport` tool use,
 * so the two surfaces never disagree. See docs/ARCHITECTURE.md §3.
 */
export async function getPropertyPassport(listingId: string) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      property: {
        include: {
          area: true,
          building: true,
          transactions: { orderBy: { transactionDate: "desc" }, take: 10 },
          rentalTransactions: { orderBy: { contractStart: "desc" }, take: 10 },
          valuations: { orderBy: { generatedAt: "desc" }, take: 1 },
          verification: true,
          history: { orderBy: { occurredAt: "desc" }, take: 10 },
        },
      },
      agent: { include: { user: true, agency: true } },
      agency: true,
    },
  });

  if (!listing) return null;

  const [comparables, typeMetric, areaMetric] = await Promise.all([
    db.listing.findMany({
      where: {
        id: { not: listing.id },
        status: "ACTIVE",
        type: listing.type,
        property: { areaId: listing.property.areaId, type: listing.property.type },
      },
      include: { property: { include: { area: true } } },
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
    // Prefer a metric scoped to this property type, but most area metrics are
    // recorded at the area level (propertyType: null) — fall back to that.
    db.marketMetric.findFirst({
      where: { areaId: listing.property.areaId, propertyType: listing.property.type },
      orderBy: { periodEnd: "desc" },
    }),
    db.marketMetric.findFirst({
      where: { areaId: listing.property.areaId, propertyType: null },
      orderBy: { periodEnd: "desc" },
    }),
  ]);

  return { listing, comparables, marketMetric: typeMetric ?? areaMetric };
}

export type PropertyPassport = NonNullable<Awaited<ReturnType<typeof getPropertyPassport>>>;
