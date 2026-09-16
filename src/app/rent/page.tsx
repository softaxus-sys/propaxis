import type { Metadata } from "next";
import { SearchPage } from "@/components/marketing/search-page";

export const metadata: Metadata = { title: "Rent" };

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <SearchPage listingType="RENT" title="Properties for rent" basePath="/rent" searchParams={await searchParams} />;
}
