import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const dict = await getDictionary();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-ink-950">{dict.staticPages.aboutTitle}</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-700">{dict.staticPages.aboutBody1}</p>
          <p className="mt-4 text-sm leading-relaxed text-sand-700">{dict.staticPages.aboutBody2}</p>
          <p className="mt-4 text-sm leading-relaxed text-sand-700">
            Qasro is a product of{" "}
            <a
              href="https://softaxis.ae"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-950 underline underline-offset-4 hover:text-bronze-600"
            >
              Soft Axis Technologies
            </a>
            .
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
