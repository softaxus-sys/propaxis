import type { Metadata } from "next";
import { SearchPage } from "@/components/marketing/search-page";

type Params = Record<string, string | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params).some(Boolean);

  return {
    title: "Properties for Rent in the UAE",
    description:
      "Browse apartments, villas and townhouses for rent across Dubai and the UAE on Qasro — real listings, transparent annual rents.",
    alternates: { canonical: "https://www.qasro.com/rent" },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function RentPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <SearchPage listingType="RENT" basePath="/rent" searchParams={await searchParams} />;
}
