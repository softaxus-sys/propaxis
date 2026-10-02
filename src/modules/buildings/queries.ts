import { db } from "@/lib/db";

export async function listBuildings() {
  const buildings = await db.building.findMany({
    include: { area: true, developer: true, _count: { select: { properties: true } } },
    orderBy: { name: "asc" },
  });

  return buildings.map((building) => ({ ...building, propertyCount: building._count.properties }));
}

export async function getBuildingBySlug(slug: string) {
  const building = await db.building.findUnique({
    where: { slug },
    include: {
      area: true,
      developer: true,
      // Editor-authored long-form content, if this building has one linked — see
      // docs/cms-specification.md §C. Only ever shown/used if actually PUBLISHED.
      cmsPage: true,
    },
  });
  if (!building) return null;

  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", property: { buildingId: building.id } },
    include: { property: { include: { area: true, building: true } }, agent: { include: { user: true } } },
    orderBy: { publishedAt: "desc" },
    take: 12,
  });

  return { building, listings };
}
