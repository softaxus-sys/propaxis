import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

const AUDIENCES = [
  {
    title: "Agents & Brokers",
    description: "Manage listings, leads, viewings and clients with an AI copilot for descriptions and follow-ups.",
    href: "/for-professionals#agents",
  },
  {
    title: "Agencies",
    description: "Team-wide CRM, performance analytics and lead distribution across your agents.",
    href: "/for-professionals#agencies",
  },
  {
    title: "Developers",
    description: "Publish projects, manage unit availability and payment plans, and capture off-plan leads.",
    href: "/for-professionals#developers",
  },
];

export function ProfessionalTeaser({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-sand-50 py-16">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink-950">{dict.home.professionalTitle}</h2>
            <p className="mt-1 max-w-lg text-sm text-sand-600">{dict.home.professionalSubtitle}</p>
          </div>
          <Link href="/vrodux" className="text-sm font-semibold text-ink-950 hover:text-bronze-500">
            {dict.home.vroduxLink} →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <Card key={a.title} className="flex flex-col p-6">
              <h3 className="font-semibold text-ink-950">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm text-sand-600">{a.description}</p>
              <Link href={a.href} className="mt-5">
                <Button variant="outline" size="sm">
                  Learn more
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
