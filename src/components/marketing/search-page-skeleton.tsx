import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCardSkeleton } from "@/components/marketing/listing-card-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors SearchPage's layout (title, filter bar, result grid) — used by /buy and
 * /rent's loading.tsx so navigating between them shows an instant skeleton instead
 * of a blank flash while the listings query resolves. */
export function SearchPageSkeleton() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-40" />

          <Skeleton className="mt-6 h-16 w-full rounded-2xl" />

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
