import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Professionals" };

const SECTIONS = [
  {
    id: "agents",
    title: "Agents & Brokers",
    points: ["Manage listings and leads in one place", "AI copilot for descriptions and follow-ups", "Track viewings and client conversations"],
    cta: { href: "/register?type=agent", label: "Register as an agent" },
  },
  {
    id: "agencies",
    title: "Agencies",
    points: ["Team-wide CRM and lead distribution", "Performance analytics per agent", "Verified agency profile on the marketplace"],
    cta: { href: "/register?type=agency", label: "Register your agency" },
  },
  {
    id: "developers",
    title: "Developers",
    points: ["Publish projects with unit-level availability", "Payment plans and floor plans", "Capture and manage off-plan leads"],
    cta: { href: "/contact", label: "Contact us" },
  },
];

export default function ForProfessionalsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink-950 py-16 text-white">
          <Container>
            <h1 className="max-w-xl text-3xl font-semibold">Built for the professional ecosystem</h1>
            <p className="mt-4 max-w-xl text-sand-200">
              Agents, agencies and developers all run on PropAxis — with business activity flowing into{" "}
              <Link href="/vrodux" className="underline underline-offset-4">
                VRODUX
              </Link>{" "}
              when you&apos;re ready.
            </p>
            <Link href="/register">
              <Button variant="accent" size="lg" className="mt-6">
                Create a professional account
              </Button>
            </Link>
          </Container>
        </section>

        <section className="py-14">
          <Container className="space-y-8">
            {SECTIONS.map((s) => (
              <Card key={s.id} id={s.id} className="p-6">
                <h2 className="text-lg font-semibold text-ink-950">{s.title}</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-sand-600">
                  {s.points.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
                <Link href={s.cta.href} className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    {s.cta.label}
                  </Button>
                </Link>
              </Card>
            ))}
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
