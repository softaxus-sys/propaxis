import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { InvestmentCalculatorForm } from "@/components/marketing/investment-calculator-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Investment Calculator" };

export default function InvestmentCalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold text-ink-950">Investment Calculator</h1>
          <p className="mt-1 text-sm text-sand-600">
            Estimate mortgage payments, rental yield and cash flow for a potential purchase.
          </p>
          <div className="mt-6">
            <InvestmentCalculatorForm />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
