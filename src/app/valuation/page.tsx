import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ValuationForm } from "@/components/marketing/valuation-form";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Property Valuation" };

export default async function ValuationPage() {
  const areas = await db.area.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold text-ink-950">Property Valuation</h1>
          <p className="mt-1 text-sm text-sand-600">
            Get an automated estimate based on recent area price-per-sqft averages.
          </p>
          <div className="mt-6">
            <ValuationForm areas={areas.map((a) => ({ id: a.id, name: a.name }))} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
