import { db } from "@/lib/db";

export async function listAreas() {
  const areas = await db.area.findMany({
    include: {
      _count: { select: { properties: true } },
      marketMetrics: { orderBy: { periodEnd: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return areas.map((area) => ({
    ...area,
    listingCount: area._count.properties,
    latestMetric: area.marketMetrics[0] ?? null,
  }));
}

export async function getAreaBySlug(slug: string) {
  const area = await db.area.findUnique({
    where: { slug },
    include: {
      marketMetrics: { orderBy: { periodEnd: "desc" }, take: 12 },
    },
  });
  if (!area) return null;

  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", property: { areaId: area.id } },
    include: { property: { include: { area: true } }, agent: { include: { user: true } } },
    orderBy: { publishedAt: "desc" },
    take: 12,
  });

  return { area, listings, latestMetric: area.marketMetrics[0] ?? null };
}

export function compareAreas(areas: Awaited<ReturnType<typeof listAreas>>, slugs: string[]) {
  return areas.filter((a) => slugs.includes(a.slug));
}
