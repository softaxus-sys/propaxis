import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HeroSearch } from "@/components/marketing/hero-search";
import { FeaturedListings } from "@/components/marketing/featured-listings";
import { AreasGrid } from "@/components/marketing/areas-grid";
import { AiTeaser } from "@/components/marketing/ai-teaser";
import { IntelligenceTeaser } from "@/components/marketing/intelligence-teaser";
import { ProfessionalTeaser } from "@/components/marketing/professional-teaser";
import { Container } from "@/components/ui/container";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-ink-950 pb-24 pt-20 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(219,178,108,0.25), transparent 40%), radial-gradient(circle at 85% 0%, rgba(46,60,107,0.5), transparent 45%)",
            }}
          />
          <Container className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-bronze-300">
              Real Estate Intelligence. Powered by AI.
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Discover, understand and compare property across the UAE.
            </h1>
            <p className="mt-5 max-w-xl text-sand-200">
              PropAxis brings together listings, transaction history, rental data and an AI assistant
              that searches real structured data — never fabricated.
            </p>

            <div className="mt-10 max-w-2xl">
              <HeroSearch />
            </div>
          </Container>
        </section>

        <FeaturedListings />
        <AreasGrid />
        <IntelligenceTeaser />
        <AiTeaser />
        <ProfessionalTeaser />
      </main>
      <SiteFooter />
    </>
  );
}
