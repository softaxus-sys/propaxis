import type { Prisma } from "@prisma/client";

/** The unit fields the card summary and detail table need. */
export type UnitLike = {
  bedrooms: number | null;
  rentPerYearAed: Prisma.Decimal | null;
  salePriceAed: Prisma.Decimal | null;
};

export type PriceType = "SALE" | "RENT";

export function unitPrice(unit: UnitLike, priceType: PriceType): number | null {
  const v = priceType === "RENT" ? unit.rentPerYearAed : unit.salePriceAed;
  return v === null ? null : Number(v);
}

export function bedroomLabel(bedrooms: number): string {
  return bedrooms === 0 ? "Studio" : `${bedrooms}BR`;
}

/** Count, price range and bedroom mix (Studio ×2, 1BR ×3, …) for one set of units,
 * priced as `priceType`. Units with no price of that type are ignored. */
export function summarizeUnits(units: UnitLike[], priceType: PriceType) {
  const priced = units.filter((u) => unitPrice(u, priceType) !== null);
  if (priced.length === 0) return null;

  const prices = priced.map((u) => unitPrice(u, priceType) as number);
  const byBedrooms = new Map<number, number>();
  for (const u of priced) {
    if (u.bedrooms === null) continue;
    byBedrooms.set(u.bedrooms, (byBedrooms.get(u.bedrooms) ?? 0) + 1);
  }
  const mix = [...byBedrooms.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bedrooms, count]) => `${bedroomLabel(bedrooms)} ×${count}`);

  return { count: priced.length, min: Math.min(...prices), max: Math.max(...prices), mix };
}
