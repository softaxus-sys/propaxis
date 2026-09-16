import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-ink-950">About PropAxis</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-700">
            PropAxis.ae is an AI-powered real estate marketplace and intelligence platform built for the
            UAE, starting with Dubai. We connect buyers, tenants, landlords, investors, agents, agencies
            and developers around one principle: every price, trend and recommendation should be
            traceable back to real, structured data — never guessed.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-sand-700">
            PropAxis Intelligence — our data layer covering asking prices, transaction history, rental
            data and market metrics — powers both the marketplace and PropAxis AI, our tool-calling
            assistant. For professionals, PropAxis is also the front door to{" "}
            <a href="/vrodux" className="underline underline-offset-4">
              VRODUX
            </a>
            , the group&apos;s CRM/ERP for running the business side of real estate.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
