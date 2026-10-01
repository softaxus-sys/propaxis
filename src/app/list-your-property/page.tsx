import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "List Your Property",
  description:
    "Own a property in the UAE and want to sell or rent it out? Tell us about it and we'll connect you with a verified Qasro agent or agency.",
};

// This is distinct from /for-professionals (agencies/agents who already run a real
// estate business) — this page is for individual landlords and property owners with
// no existing agent relationship. Checked first: no equivalent URL existed before this.
const STEPS = [
  { title: "Tell us about your property", body: "Share the location, type and a few details using the form below — takes a couple of minutes." },
  { title: "We connect you with an agent", body: "A verified agent or agency on Qasro picks it up and reaches out to discuss listing it." },
  { title: "Your property goes live", body: "Once you agree terms with the agent, your listing is published on Qasro's marketplace." },
];

export default async function ListYourPropertyPage() {
  const dict = await getDictionary();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-16">
        <Container className="max-w-4xl">
          <h1 className="text-3xl font-semibold text-ink-950">List your property on Qasro</h1>
          <p className="mt-3 max-w-xl text-sand-600">
            Selling or renting out a property you own? Tell us about it and we&apos;ll put you in touch with a
            verified agent or agency on Qasro to get it listed.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {STEPS.map((step, i) => (
                <Card key={step.title} className="flex gap-4 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-semibold text-ink-950">{step.title}</h2>
                    <p className="mt-1 text-sm text-sand-600">{step.body}</p>
                  </div>
                </Card>
              ))}

              <Card className="p-5">
                <h2 className="font-semibold text-ink-950">Are you an agent or agency instead?</h2>
                <p className="mt-1 text-sm text-sand-600">
                  If you already work in real estate, registering directly gets you publishing on Qasro yourself —
                  see{" "}
                  <a href="/for-professionals" className="text-bronze-600 underline underline-offset-4">
                    for-professionals
                  </a>
                  .
                </p>
              </Card>
            </div>

            <EnquiryForm heading="Tell us about your property" dict={dict} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
