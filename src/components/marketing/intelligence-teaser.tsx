import { FileSearch, TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";
import { Container } from "@/components/ui/container";

const FEATURES = [
  {
    icon: FileSearch,
    title: "Property Passport",
    description: "One structured profile — asking price, comparables, transaction and rental history, all in one place.",
  },
  {
    icon: TrendingUp,
    title: "Price & rental trends",
    description: "Track AED/sqft and rental yield movement by area, building and property type over time.",
  },
  {
    icon: BarChart3,
    title: "Comparables & valuation range",
    description: "See how a listing stacks up against similar recent transactions before you make an offer.",
  },
  {
    icon: ShieldCheck,
    title: "Verification & confidence",
    description: "Every data point carries a source and confidence score — no data is presented as fact without provenance.",
  },
];

export function IntelligenceTeaser() {
  return (
    <section className="py-16">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink-950">PropAxis Intelligence</h2>
          <p className="mt-2 text-sm text-sand-600">
            Every property, building and area eventually carries an intelligence layer — grounded in
            structured data, not guesswork.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bronze-100 text-bronze-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-950">{title}</h3>
              <p className="mt-1.5 text-sm text-sand-600">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
