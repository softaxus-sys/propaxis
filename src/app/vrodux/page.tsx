import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "VRODUX for business" };

const PRODUCTS = [
  { name: "VRODUX CRM", description: "Leads, viewings, opportunities and deals — synced straight from your PropAxis listings." },
  { name: "VRODUX Professional", description: "For individual agents managing their own pipeline and clients." },
  { name: "VRODUX ERP", description: "Full back-office: finance, contracts and operations for growing agencies." },
  { name: "VRODUX Enterprise", description: "Multi-branch agencies and developers running at scale." },
];

const FLOW = [
  "PropAxis listing",
  "Customer enquiry",
  "PropAxis lead",
  "VRODUX CRM",
  "Follow-up / viewing",
  "Opportunity",
  "Deal",
];

export default function VroduxPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink-950 py-16 text-white">
          <Container>
            <span className="text-xs font-semibold uppercase tracking-wide text-bronze-300">VRODUX</span>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold">Run your real estate business with VRODUX</h1>
            <p className="mt-4 max-w-xl text-sand-200">
              PropAxis is the marketplace and intelligence layer. VRODUX is the business operating
              system underneath it — every enquiry your listings generate can flow straight into your
              CRM pipeline.
            </p>
          </Container>
        </section>

        <section className="py-14">
          <Container>
            <h2 className="text-lg font-semibold text-ink-950">How a lead flows through</h2>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              {FLOW.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-sand-300 bg-white px-3 py-1.5 text-ink-950">{step}</span>
                  {i < FLOW.length - 1 && <span className="text-sand-400">→</span>}
                </div>
              ))}
            </div>

            <h2 className="mt-14 text-lg font-semibold text-ink-950">Products</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {PRODUCTS.map((p) => (
                <Card key={p.name} className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-bronze-500" />
                    <h3 className="font-semibold text-ink-950">{p.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-sand-600">{p.description}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
