import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { listAreas } from "@/modules/areas/queries";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

// Royalty-free photography (Pexels License — free for commercial use), resized and
// re-encoded to webp, stored locally under public/images/areas. Keyed by area slug;
// areas without a dedicated shot (new ones added later) fall back to the generic
// "dubai" skyline image rather than rendering with no photo at all.
const AREA_IMAGES: Record<string, string> = {
  "dubai-marina": "/images/areas/dubai-marina.webp",
  "downtown-dubai": "/images/areas/downtown-dubai.webp",
  "palm-jumeirah": "/images/areas/palm-jumeirah.webp",
  "business-bay": "/images/areas/business-bay.webp",
  jvc: "/images/areas/jvc.webp",
  "arabian-ranches": "/images/areas/arabian-ranches.webp",
  dubai: "/images/areas/dubai.webp",
};
const FALLBACK_AREA_IMAGE = "/images/areas/dubai.webp";

export async function AreasGrid({ dict }: { dict: Dictionary }) {
  const areas = await listAreas();
  if (areas.length === 0) return null;

  return (
    <section className="bg-sand-50 py-16">
      <Container>
        <h2 className="text-2xl font-semibold text-ink-950">{dict.home.areasTitle}</h2>
        <p className="mt-1 text-sm text-sand-600">{dict.home.areasSubtitle}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {areas.slice(0, 6).map((area) => (
            <Link key={area.slug} href={`/areas/${area.slug}`}>
              <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-28 w-full overflow-hidden">
                  <Image
                    src={AREA_IMAGES[area.slug] ?? FALLBACK_AREA_IMAGE}
                    alt={area.name}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {area.latestMetric?.isDemoData && (
                    <DemoDataBadge className="absolute end-2 top-2 bg-white/90" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-ink-950">{area.name}</h3>
                  <p className="mt-2 text-xs text-sand-600">{area.listingCount.toLocaleString()} listings</p>
                  {area.latestMetric?.avgPricePerSqftAed && (
                    <p className="mt-1 text-sm font-semibold text-ink-950">
                      {formatAed(Number(area.latestMetric.avgPricePerSqftAed))}{" "}
                      <span className="font-normal text-sand-600">/ sqft</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
