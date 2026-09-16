import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { getAgentBySlug } from "@/modules/agents/queries";
import { getDictionary } from "@/lib/i18n/server";

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [agent, dict] = await Promise.all([getAgentBySlug(slug), getDictionary()]);
  if (!agent) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xl font-semibold text-white">
                  {agent.user.name?.[0] ?? "A"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-ink-950">{agent.user.name}</h1>
                    {agent.isVerified && <Badge variant="success">{dict.property.verified}</Badge>}
                    {agent.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
                  </div>
                  {agent.agency && (
                    <Link
                      href={`/agencies/${agent.agency.slug}`}
                      className="mt-1 block text-sm text-sand-600 underline underline-offset-4"
                    >
                      {agent.agency.name}
                    </Link>
                  )}
                  {agent.languages.length > 0 && (
                    <p className="mt-2 text-xs text-sand-500">Speaks {agent.languages.join(", ").toUpperCase()}</p>
                  )}
                </div>
              </div>

              {agent.bio && <p className="max-w-2xl text-sm leading-relaxed text-sand-700">{agent.bio}</p>}

              <h2 className="text-lg font-semibold text-ink-950">
                {dict.agents.activeListings} ({agent.listings.length})
              </h2>
              {agent.listings.length === 0 ? (
                <p className="text-sm text-sand-600">{dict.agents.noActiveListings}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {agent.listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} dict={dict} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <EnquiryForm
                agentId={agent.id}
                heading={`${dict.agents.contactAgent} ${agent.user.name?.split(" ")[0] ?? ""}`}
                dict={dict}
              />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
