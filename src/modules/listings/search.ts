import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const listingSearchSchema = z.object({
  listingType: z.enum(["SALE", "RENT"]).default("SALE"),
  location: z.string().trim().optional(),
  areaSlug: z.string().trim().optional(),
  propertyType: z
    .enum(["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"])
    .optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type ListingSearchInput = z.infer<typeof listingSearchSchema>;

const PAGE_SIZE = 12;

export async function searchListings(rawInput: Partial<ListingSearchInput>) {
  const input = listingSearchSchema.parse(rawInput);

  const priceField = input.listingType === "SALE" ? "askingPriceAed" : "askingRentAedYear";
  const unitPriceField = input.listingType === "SALE" ? "salePriceAed" : "rentPerYearAed";
  const priceRange =
    input.minPrice !== undefined || input.maxPrice !== undefined
      ? {
          ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
          ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
        }
      : undefined;

  // Building-level (Vrodux-synced) listings are matched on their units: a building is
  // one result if ANY active unit satisfies every filter, and only those units come
  // back with it. Listings without units (hand-made) match on their own fields.
  const unitWhere: Prisma.ListingUnitWhereInput = {
    active: true,
    [unitPriceField]: priceRange ? { not: null, ...priceRange } : { not: null },
    ...(input.propertyType ? { propertyType: input.propertyType } : {}),
    ...(input.bedrooms !== undefined ? { bedrooms: { gte: input.bedrooms } } : {}),
  };

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    property: {
      area: {
        ...(input.areaSlug ? { slug: input.areaSlug } : {}),
        ...(input.location ? { name: { contains: input.location, mode: "insensitive" as const } } : {}),
      },
    },
    OR: [
      { units: { some: unitWhere } },
      {
        units: { none: {} },
        type: input.listingType,
        ...(priceRange ? { [priceField]: priceRange } : {}),
        property: {
          ...(input.propertyType ? { type: input.propertyType } : {}),
          ...(input.bedrooms !== undefined ? { bedrooms: { gte: input.bedrooms } } : {}),
        },
      },
    ],
  };

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      include: {
        property: { include: { area: true, building: true } },
        agent: { include: { user: true } },
        agency: true,
        units: { where: unitWhere, orderBy: { [unitPriceField]: "asc" } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (input.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.listing.count({ where }),
  ]);

  return {
    listings,
    total,
    page: input.page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type SearchListingsResult = Awaited<ReturnType<typeof searchListings>>;
export type ListingWithRelations = SearchListingsResult["listings"][number];
