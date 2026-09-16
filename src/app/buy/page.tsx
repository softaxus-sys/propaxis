import type { Metadata } from "next";
import { SearchPage } from "@/components/marketing/search-page";

export const metadata: Metadata = { title: "Buy" };

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <SearchPage listingType="SALE" basePath="/buy" searchParams={await searchParams} />;
}
