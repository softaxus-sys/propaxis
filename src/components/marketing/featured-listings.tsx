import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ListingCard } from "@/components/marketing/listing-card";
import { db } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

export async function FeaturedListings({ dict }: { dict: Dictionary }) {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    include: { property: { include: { area: true, building: true } }, agent: { include: { user: true } }, agency: true },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });

  if (listings.length === 0) return null;

  return (
    <section className="py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink-950">{dict.home.featuredTitle}</h2>
            <p className="mt-1 text-sm text-sand-600">{dict.home.featuredSubtitle}</p>
          </div>
          <Link href="/buy" className="hidden text-sm font-semibold text-ink-950 hover:text-bronze-500 sm:block">
            {dict.home.viewAll} →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} dict={dict} />
          ))}
        </div>
      </Container>
    </section>
  );
}
