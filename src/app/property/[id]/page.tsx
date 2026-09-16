import { notFound } from "next/navigation";
import Link from "next/link";
import { BedDouble, Bath, Ruler, ShieldCheck, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { getPropertyPassport } from "@/modules/properties/passport";

const VERIFICATION_LABEL: Record<string, string> = {
  UNVERIFIED: "Unverified",
  PENDING: "Verification pending",
  VERIFIED: "Verified",
  REJECTED: "Verification rejected",
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const passport = await getPropertyPassport(id);
  if (!passport) notFound();

  const { listing, comparables, marketMetric } = passport;
  const { property } = listing;
  const price =
    listing.type === "SALE"
      ? formatAed(Number(listing.askingPriceAed ?? 0))
      : `${formatAed(Number(listing.askingRentAedYear ?? 0))}/yr`;

  const latestTransaction = property.transactions[0];
  const latestRental = property.rentalTransactions[0];
  const valuation = property.valuations[0];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex flex-wrap items-center gap-2 text-sm text-sand-600">
            <Link href={listing.type === "SALE" ? "/buy" : "/rent"} className="hover:text-ink-950">
              {listing.type === "SALE" ? "Buy" : "Rent"}
            </Link>
            <span>/</span>
            <span>{property.area.name}</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 to-ink-950 p-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={listing.type === "SALE" ? "accent" : "info"}>
                    {listing.type === "SALE" ? "For Sale" : "For Rent"}
                  </Badge>
                  {listing.isDemoData && <DemoDataBadge className="bg-white/90" />}
                </div>
                <h1 className="mt-3 text-2xl font-semibold">{listing.title}</h1>
                <p className="mt-1 text-sand-200">
                  {property.building ? `${property.building.name}, ` : ""}
                  {property.area.name}
                </p>
              </div>
              <p className="text-3xl font-semibold">{price}</p>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sand-200">
              {(property.bedrooms ?? 0) > 0 && (
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> {property.bedrooms} beds
                </span>
              )}
              <span className="flex items-center gap-2">
                <Bath className="h-4 w-4" /> {property.bathrooms} baths
              </span>
              {property.areaSqft && (
                <span className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> {property.areaSqft.toLocaleString()} sqft
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {listing.description && (
                <Card className="p-6">
                  <h2 className="font-semibold text-ink-950">About this property</h2>
                  <p className="mt-3 text-sm leading-relaxed text-sand-700">{listing.description}</p>
                  {listing.amenities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {listing.amenities.map((a) => (
                        <Badge key={a} variant="neutral">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Property Passport */}
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-bronze-500" />
                  <h2 className="font-semibold text-ink-950">Property Passport</h2>
                </div>
                <p className="mt-1 text-sm text-sand-600">
                  Everything PropAxis knows about this property — grounded in structured data.
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-sand-500">Verification</dt>
                    <dd className="mt-1 text-sm font-medium text-ink-950">
                      {VERIFICATION_LABEL[property.verification?.status ?? "UNVERIFIED"]}
                    </dd>
                  </div>
                  {latestTransaction && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Last transaction</dt>
                      <dd className="mt-1 text-sm font-medium text-ink-950">
                        {formatAed(Number(latestTransaction.priceAed), { compact: true })}
                      </dd>
                    </div>
                  )}
                  {latestRental && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Last rental</dt>
                      <dd className="mt-1 text-sm font-medium text-ink-950">
                        {formatAed(Number(latestRental.annualRentAed), { compact: true })}/yr
                      </dd>
                    </div>
                  )}
                  {marketMetric?.avgPricePerSqftAed && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Area avg. AED/sqft</dt>
                      <dd className="mt-1 text-sm font-medium text-ink-950">
                        {formatAed(Number(marketMetric.avgPricePerSqftAed))}
                      </dd>
                    </div>
                  )}
                  {marketMetric?.grossRentalYieldPct && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Area gross yield</dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm font-medium text-success">
                        <TrendingUp className="h-3.5 w-3.5" /> {Number(marketMetric.grossRentalYieldPct)}%
                      </dd>
                    </div>
                  )}
                  {valuation && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Est. valuation range</dt>
                      <dd className="mt-1 text-sm font-medium text-ink-950">
                        {formatAed(Number(valuation.estimatedRangeLowAed), { compact: true })} –{" "}
                        {formatAed(Number(valuation.estimatedRangeHighAed), { compact: true })}
                      </dd>
                    </div>
                  )}
                </dl>

                {!latestTransaction && !latestRental && !marketMetric && (
                  <p className="mt-4 text-sm text-sand-500">
                    No transaction, rental or market history recorded for this property yet.
                  </p>
                )}
              </Card>

              {comparables.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold text-ink-950">Comparable listings</h2>
                  <div className="mt-4 divide-y divide-sand-100">
                    {comparables.map((c) => (
                      <Link
                        key={c.id}
                        href={`/property/${c.id}`}
                        className="flex items-center justify-between py-3 text-sm hover:text-bronze-500"
                      >
                        <span className="text-ink-950">
                          {c.title} <span className="text-sand-500">· {c.property.area.name}</span>
                        </span>
                        <span className="font-medium text-ink-950">
                          {c.type === "SALE"
                            ? formatAed(Number(c.askingPriceAed ?? 0), { compact: true })
                            : `${formatAed(Number(c.askingRentAedYear ?? 0), { compact: true })}/yr`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {listing.agent && (
                <Card className="p-6">
                  <h3 className="font-semibold text-ink-950">Listed by</h3>
                  <Link href={`/agents/${listing.agent.slug}`} className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
                      {listing.agent.user.name?.[0] ?? "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-950">{listing.agent.user.name}</p>
                      {listing.agency && <p className="text-xs text-sand-600">{listing.agency.name}</p>}
                    </div>
                  </Link>
                </Card>
              )}

              <EnquiryForm listingId={listing.id} agentId={listing.agentId} />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
