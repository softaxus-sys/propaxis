import Link from "next/link";
import { BedDouble, Bath, Ruler } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";

/** The minimal shape ListingCard needs — any listing query that includes at least
 * `property.area` satisfies this, regardless of what else it joins. */
export type ListingCardData = {
  id: string;
  title: string;
  type: "SALE" | "RENT";
  askingPriceAed: Prisma.Decimal | null;
  askingRentAedYear: Prisma.Decimal | null;
  isDemoData: boolean;
  property: {
    area: { name: string };
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqft: number | null;
  };
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const price =
    listing.type === "SALE"
      ? formatAed(Number(listing.askingPriceAed ?? 0), { compact: true })
      : `${formatAed(Number(listing.askingRentAedYear ?? 0), { compact: true })}/yr`;

  return (
    <Link href={`/property/${listing.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative flex h-44 items-end bg-gradient-to-br from-ink-800 to-ink-950 p-4">
          <Badge variant={listing.type === "SALE" ? "accent" : "info"} className="absolute left-4 top-4">
            {listing.type === "SALE" ? "For Sale" : "For Rent"}
          </Badge>
          {listing.isDemoData && <DemoDataBadge className="absolute right-4 top-4 bg-white/90" />}
          <span className="text-lg font-semibold text-white">{price}</span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-semibold text-ink-950">{listing.title}</h3>
            <p className="text-sm text-sand-600">{listing.property.area.name}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-sand-600">
            {(listing.property.bedrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4" /> {listing.property.bedrooms}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4" /> {listing.property.bathrooms}
            </span>
            {listing.property.areaSqft && (
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" /> {listing.property.areaSqft.toLocaleString()} sqft
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
