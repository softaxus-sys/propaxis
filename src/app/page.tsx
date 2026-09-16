import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HeroSearch } from "@/components/marketing/hero-search";
import { FeaturedListings } from "@/components/marketing/featured-listings";
import { AreasGrid } from "@/components/marketing/areas-grid";
import { AiTeaser } from "@/components/marketing/ai-teaser";
import { IntelligenceTeaser } from "@/components/marketing/intelligence-teaser";
import { ProfessionalTeaser } from "@/components/marketing/professional-teaser";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/lib/i18n/server";

export default async function Home() {
  const dict = await getDictionary();

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
              {dict.home.tagline}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              {dict.home.headline}
            </h1>
            <p className="mt-5 max-w-xl text-sand-200">{dict.home.subheadline}</p>

            <div className="mt-10 max-w-2xl">
              <HeroSearch dict={dict} />
            </div>
          </Container>
        </section>

        <FeaturedListings dict={dict} />
        <AreasGrid dict={dict} />
        <IntelligenceTeaser dict={dict} />
        <AiTeaser dict={dict} />
        <ProfessionalTeaser dict={dict} />
      </main>
      <SiteFooter />
    </>
  );
}
