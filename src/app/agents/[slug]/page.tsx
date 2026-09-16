import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { getAgentBySlug } from "@/modules/agents/queries";

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
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
                    {agent.isVerified && <Badge variant="success">Verified</Badge>}
                    {agent.isDemoData && <DemoDataBadge />}
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
                Active listings ({agent.listings.length})
              </h2>
              {agent.listings.length === 0 ? (
                <p className="text-sm text-sand-600">No active listings right now.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {agent.listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <EnquiryForm agentId={agent.id} heading={`Contact ${agent.user.name?.split(" ")[0] ?? "agent"}`} />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
