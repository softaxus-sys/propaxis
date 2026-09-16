import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ValuationForm } from "@/components/marketing/valuation-form";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Property Valuation" };

export default async function ValuationPage() {
  const [areas, dict] = await Promise.all([db.area.findMany({ orderBy: { name: "asc" } }), getDictionary()]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold text-ink-950">{dict.valuation.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.valuation.pageSubtitle}</p>
          <div className="mt-6">
            <ValuationForm areas={areas.map((a) => ({ id: a.id, name: a.name }))} dict={dict} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
