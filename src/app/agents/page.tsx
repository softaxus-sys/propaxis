import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { listAgents } from "@/modules/agents/queries";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage() {
  const [agents, dict] = await Promise.all([listAgents(), getDictionary()]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">{dict.agents.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.agents.pageSubtitle}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Link key={agent.slug} href={`/agents/${agent.slug}`}>
                <Card className="flex items-start gap-4 p-5 transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-950 text-base font-semibold text-white">
                    {agent.user.name?.[0] ?? "A"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-ink-950">{agent.user.name}</h3>
                      {agent.isVerified && <Badge variant="success">{dict.property.verified}</Badge>}
                      {agent.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
                    </div>
                    {agent.agency && <p className="mt-0.5 text-sm text-sand-600">{agent.agency.name}</p>}
                    <p className="mt-2 text-xs text-sand-500">
                      {agent._count.listings} {dict.agents.activeListings.toLowerCase()}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
