import Link from "next/link";
import { BedDouble, Bath, Ruler } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

/** The minimal shape ListingCard needs — any listing query that includes at least
 * `property.area` satisfies this, regardless of what else it joins. */
export type ListingCardData = {
  id: string;
  title: string;
  type: "SALE" | "RENT";
  askingPriceAed: Prisma.Decimal | null;
  askingRentAedYear: Prisma.Decimal | null;
  isDemoData: boolean;
  images: string[];
  property: {
    area: { name: string };
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqft: number | null;
  };
};

export function ListingCard({ listing, dict }: { listing: ListingCardData; dict: Dictionary }) {
  const price =
    listing.type === "SALE"
      ? formatAed(Number(listing.askingPriceAed ?? 0), { compact: true })
      : `${formatAed(Number(listing.askingRentAedYear ?? 0), { compact: true })}/yr`;
  const coverImage = listing.images[0];

  return (
    <Link href={`/property/${listing.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="relative flex h-44 items-end overflow-hidden bg-gradient-to-br from-ink-800 to-ink-950 p-4">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element -- external, dynamically-sourced photo (agency uploads, Vrodux-synced signed URLs); see docs/ARCHITECTURE.md §7.2
            <img
              src={coverImage}
              alt={listing.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {coverImage && <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 to-ink-950/10" />}
          <Badge variant={listing.type === "SALE" ? "accent" : "info"} className="absolute start-4 top-4 z-10">
            {listing.type === "SALE" ? dict.common.forSale : dict.common.forRent}
          </Badge>
          {listing.isDemoData && (
            <DemoDataBadge label={dict.common.demoData} className="absolute end-4 top-4 z-10 bg-white/90" />
          )}
          <span className="relative z-10 text-lg font-semibold text-white">{price}</span>
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
                <Ruler className="h-4 w-4" /> {listing.property.areaSqft.toLocaleString()} {dict.common.sqft}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
