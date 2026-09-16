import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { getAreaBySlug } from "@/modules/areas/queries";

export default async function AreaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getAreaBySlug(slug);
  if (!result) notFound();

  const { area, listings, latestMetric } = result;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{area.name}</h1>
            {latestMetric?.isDemoData && <DemoDataBadge />}
          </div>
          {area.description && <p className="mt-2 max-w-2xl text-sm text-sand-600">{area.description}</p>}

          {latestMetric && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">Avg. AED/sqft</p>
                <p className="mt-1 text-lg font-semibold text-ink-950">
                  {latestMetric.avgPricePerSqftAed ? formatAed(Number(latestMetric.avgPricePerSqftAed)) : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">Avg. annual rent</p>
                <p className="mt-1 text-lg font-semibold text-ink-950">
                  {latestMetric.avgAnnualRentAed ? formatAed(Number(latestMetric.avgAnnualRentAed), { compact: true }) : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">Gross rental yield</p>
                <p className="mt-1 text-lg font-semibold text-success">
                  {latestMetric.grossRentalYieldPct ? `${Number(latestMetric.grossRentalYieldPct)}%` : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">Price change (period)</p>
                <p
                  className={`mt-1 flex items-center gap-1 text-lg font-semibold ${
                    Number(latestMetric.priceChangePct ?? 0) >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {Number(latestMetric.priceChangePct ?? 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {latestMetric.priceChangePct ? `${Number(latestMetric.priceChangePct)}%` : "—"}
                </p>
              </Card>
            </div>
          )}

          <h2 className="mt-10 text-lg font-semibold text-ink-950">Listings in {area.name}</h2>
          {listings.length === 0 ? (
            <p className="mt-4 text-sm text-sand-600">No active listings in this area yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
