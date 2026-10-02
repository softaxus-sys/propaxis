import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DemoDataBadge } from "@/components/ui/badge";
import { getBuildingBySlug } from "@/modules/buildings/queries";
import { getDictionary } from "@/lib/i18n/server";
import { renderCmsBody } from "@/modules/cms/render";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBuildingBySlug(slug);
  if (!result) return {};

  const { building, listings } = result;
  const cms = building.cmsPage?.status === "PUBLISHED" ? building.cmsPage : null;

  const description =
    cms?.seoDescription ||
    (listings.length > 0
      ? `${listings.length} propert${listings.length === 1 ? "y" : "ies"} for sale and rent in ${building.name}, ${building.area.name} — prices, photos and details on Qasro.`
      : `Explore ${building.name}, ${building.area.name} on Qasro — upcoming listings in this building.`);

  return {
    title: cms?.seoTitle || `Properties in ${building.name}, ${building.area.name}`,
    description,
    alternates: { canonical: cms?.canonicalUrl || `https://www.qasro.com/buildings/${slug}` },
  };
}

export default async function BuildingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, dict] = await Promise.all([getBuildingBySlug(slug), getDictionary()]);
  if (!result) notFound();

  const { building, listings } = result;
  const cmsHtml = building.cmsPage?.status === "PUBLISHED" ? renderCmsBody(building.cmsPage.body) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{building.name}</h1>
            {building.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
          </div>
          <p className="mt-1 text-sm text-sand-600">
            <Link href={`/areas/${building.area.slug}`} className="hover:text-ink-950 hover:underline">
              {building.area.name}
            </Link>
            {building.developer && (
              <>
                {" · "}
                <Link href={`/developers/${building.developer.slug}`} className="hover:text-ink-950 hover:underline">
                  {building.developer.name}
                </Link>
              </>
            )}
          </p>
          {building.description && <p className="mt-2 max-w-2xl text-sm text-sand-600">{building.description}</p>}

          {(building.totalFloors || building.yearBuilt) && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {building.totalFloors && (
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-sand-500">{dict.buildings.totalFloors}</p>
                  <p className="mt-1 text-lg font-semibold text-ink-950">{building.totalFloors}</p>
                </Card>
              )}
              {building.yearBuilt && (
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-sand-500">{dict.buildings.yearBuilt}</p>
                  <p className="mt-1 text-lg font-semibold text-ink-950">{building.yearBuilt}</p>
                </Card>
              )}
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
            {dict.buildings.listingsInBuilding} {building.name}
          </h2>
          {listings.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={dict.buildings.noListingsYet}
              description={dict.buildings.noListingsYetHint}
              action={
                <Link href="/buildings">
                  <Button variant="outline" size="sm">
                    {dict.buildings.browseOtherBuildings}
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
