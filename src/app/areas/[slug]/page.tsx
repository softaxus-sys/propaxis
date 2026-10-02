import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { getAreaBySlug } from "@/modules/areas/queries";
import { getDictionary } from "@/lib/i18n/server";
import { renderCmsBody } from "@/modules/cms/render";

/** Description is derived from the area's real listing count, not a fixed template —
 * see docs/seo-architecture.md on avoiding "thin" identical location pages. A
 * zero-listing area is a real content gap, not something to paper over with copy.
 * A linked, PUBLISHED COMMUNITY CmsPage's own SEO title/description take priority when
 * present — editor-authored copy beats a mechanically-derived one. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAreaBySlug(slug);
  if (!result) return {};

  const { area, listings } = result;
  const cms = area.cmsPage?.status === "PUBLISHED" ? area.cmsPage : null;

  const description =
    cms?.seoDescription ||
    (listings.length > 0
      ? `${listings.length} propert${listings.length === 1 ? "y" : "ies"} for sale and rent in ${area.name}, ${area.city} — prices, photos and market trends on Qasro.`
      : `Explore ${area.name}, ${area.city} on Qasro — market trends and upcoming listings.`);

  return {
    title: cms?.seoTitle || `Properties in ${area.name}, ${area.city}`,
    description,
    alternates: { canonical: cms?.canonicalUrl || `https://www.qasro.com/areas/${slug}` },
  };
}

export default async function AreaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, dict] = await Promise.all([getAreaBySlug(slug), getDictionary()]);
  if (!result) notFound();

  const { area, listings, latestMetric } = result;
  const cmsHtml =
    area.cmsPage?.status === "PUBLISHED" ? renderCmsBody(area.cmsPage.body) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{area.name}</h1>
            {latestMetric?.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
          </div>
          {area.description && <p className="mt-2 max-w-2xl text-sm text-sand-600">{area.description}</p>}

          {latestMetric && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">{dict.areas.avgPricePerSqft}</p>
                <p className="mt-1 text-lg font-semibold text-ink-950">
                  {latestMetric.avgPricePerSqftAed ? formatAed(Number(latestMetric.avgPricePerSqftAed)) : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">{dict.areas.avgAnnualRent}</p>
                <p className="mt-1 text-lg font-semibold text-ink-950">
                  {latestMetric.avgAnnualRentAed ? formatAed(Number(latestMetric.avgAnnualRentAed), { compact: true }) : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">{dict.areas.grossRentalYield}</p>
                <p className="mt-1 text-lg font-semibold text-success">
                  {latestMetric.grossRentalYieldPct ? `${Number(latestMetric.grossRentalYieldPct)}%` : "—"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-sand-500">{dict.areas.priceChange}</p>
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

          {cmsHtml && (
            <div
              className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-sand-700
                [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-950
                [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-950
                [&_a]:text-bronze-600 [&_a]:underline [&_a]:underline-offset-4
                [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mt-1"
              dangerouslySetInnerHTML={{ __html: cmsHtml }}
            />
          )}

          <h2 className="mt-10 text-lg font-semibold text-ink-950">
            {dict.areas.listingsInArea} {area.name}
          </h2>
          {listings.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={dict.areas.noListingsYet}
              description={dict.areas.noListingsYetHint}
              action={
                <Link href="/areas">
                  <Button variant="outline" size="sm">
                    {dict.areas.browseOtherAreas}
                  </Button>
                </Link>
              }
              className="mt-6"
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} dict={dict} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
