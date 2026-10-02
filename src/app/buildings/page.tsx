import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { listBuildings } from "@/modules/buildings/queries";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Explore Buildings & Towers in the UAE",
  description: "Browse real buildings and towers with active listings across Dubai and the UAE, on Qasro.",
  alternates: { canonical: "https://www.qasro.com/buildings" },
};

export default async function BuildingsPage() {
  const [buildings, dict] = await Promise.all([listBuildings(), getDictionary()]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">{dict.buildings.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.buildings.pageSubtitle}</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {buildings.map((building) => (
              <Link key={building.slug} href={`/buildings/${building.slug}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-ink-950">{building.name}</h3>
                    {building.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
                  </div>
                  <p className="mt-1 text-xs text-sand-600">{building.area.name}</p>
                  <p className="mt-3 text-xs text-sand-600">
                    {building.propertyCount.toLocaleString()} {dict.buildings.listingsLabel}
                  </p>
                </Card>
              </Link>
            ))}
            {buildings.length === 0 && (
              <p className="col-span-full text-sm text-sand-600">{dict.buildings.noListingsYet}</p>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
