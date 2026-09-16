import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SearchFilters } from "@/components/marketing/search-filters";
import { ListingCard } from "@/components/marketing/listing-card";
import { Pagination } from "@/components/marketing/pagination";
import { Container } from "@/components/ui/container";
import { searchListings } from "@/modules/listings/search";

type Params = Record<string, string | undefined>;

export async function SearchPage({
  listingType,
  title,
  searchParams,
  basePath,
}: {
  listingType: "SALE" | "RENT";
  title: string;
  searchParams: Params;
  basePath: string;
}) {
  const result = await searchListings({
    listingType,
    location: searchParams.location,
    areaSlug: searchParams.areaSlug,
    propertyType: searchParams.propertyType as never,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
          <p className="mt-1 text-sm text-sand-600">
            {result.total.toLocaleString()} {result.total === 1 ? "listing" : "listings"} found
          </p>

          <div className="mt-6">
            <SearchFilters />
          </div>

          {result.listings.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
              <p className="text-sand-600">No listings match these filters yet.</p>
              <p className="mt-1 text-sm text-sand-500">Try widening your price range or clearing a filter.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <Pagination page={result.page} totalPages={result.totalPages} basePath={basePath} searchParams={searchParams} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
