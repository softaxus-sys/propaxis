import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AiChat } from "@/components/marketing/ai-chat";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "PropAxis AI" };

export default async function AiSearchPage() {
  const dict = await getDictionary();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold text-ink-950">{dict.aiSearch.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.aiSearch.pageSubtitle}</p>
          <div className="mt-6">
            <AiChat />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
