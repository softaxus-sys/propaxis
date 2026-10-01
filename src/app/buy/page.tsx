import type { Metadata } from "next";
import { SearchPage } from "@/components/marketing/search-page";

type Params = Record<string, string | undefined>;

/** Base /buy is indexable; any filter/sort/page param makes it a "thin" variant that
 * shouldn't compete with the canonical page for the same query — see
 * docs/seo-architecture.md's indexation policy. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params).some(Boolean);

  return {
    title: "Properties for Sale in the UAE",
    description:
      "Browse apartments, villas, townhouses and commercial properties for sale across Dubai and the UAE on Qasro — real listings, transparent pricing.",
    alternates: { canonical: "https://www.qasro.com/buy" },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function BuyPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <SearchPage listingType="SALE" basePath="/buy" searchParams={await searchParams} />;
}
