import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, dict] = await Promise.all([
    db.project.findUnique({
      where: { slug },
      include: { area: true, developer: true, units: { orderBy: { priceAed: "asc" } } },
    }),
    getDictionary(),
  ]);

  if (!project) notFound();

  const paymentPlan = Array.isArray(project.paymentPlan)
    ? (project.paymentPlan as { milestone: string; percent: number }[])
    : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex flex-wrap items-center gap-2 text-sm text-sand-600">
            <Link href="/new-projects" className="hover:text-ink-950">
              {dict.nav.newProjects}
            </Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-ink-950">{project.name}</h1>
                {project.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
              </div>
              <p className="mt-1 text-sm text-sand-600">
                {project.area.name} ·{" "}
                <Link href={`/developers/${project.developer.slug}`} className="underline underline-offset-4">
                  {project.developer.name}
                </Link>
              </p>
            </div>
            <Badge variant="accent">
              {project.startingPriceAed
                ? `${dict.newProjects.startingFrom} ${formatAed(Number(project.startingPriceAed), { compact: true })}`
                : dict.newProjects.priceOnRequest}
            </Badge>
          </div>

          {project.description && <p className="mt-6 max-w-2xl text-sm text-sand-700">{project.description}</p>}

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <Card className="p-6">
                <h2 className="font-semibold text-ink-950">{dict.newProjects.availableUnitTypes}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand-200 text-left text-sand-600">
                        <th className="py-2 pr-4 font-medium">{dict.newProjects.unitTypeCol}</th>
                        <th className="py-2 pr-4 font-medium">{dict.newProjects.bedBathCol}</th>
                        <th className="py-2 pr-4 font-medium">{dict.newProjects.areaCol}</th>
                        <th className="py-2 pr-4 font-medium">{dict.newProjects.priceCol}</th>
                        <th className="py-2 font-medium">{dict.newProjects.availabilityCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.units.map((unit) => (
                        <tr key={unit.id} className="border-b border-sand-100 last:border-0">
                          <td className="py-2.5 pr-4 text-ink-950">{unit.unitType}</td>
                          <td className="py-2.5 pr-4 text-sand-700">
                            {unit.bedrooms} / {unit.bathrooms}
                          </td>
                          <td className="py-2.5 pr-4 text-sand-700">
                            {unit.areaSqft.toLocaleString()} {dict.common.sqft}
                          </td>
                          <td className="py-2.5 pr-4 font-medium text-ink-950">
                            {formatAed(Number(unit.priceAed), { compact: true })}
                          </td>
                          <td className="py-2.5">
                            <Badge variant={unit.availability === "AVAILABLE" ? "success" : "neutral"}>
                              {unit.availability}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {paymentPlan && (
                <Card className="p-6">
                  <h2 className="font-semibold text-ink-950">{dict.newProjects.paymentPlan}</h2>
                  <ul className="mt-4 space-y-2">
                    {paymentPlan.map((p) => (
                      <li key={p.milestone} className="flex justify-between text-sm">
                        <span className="text-sand-700">{p.milestone}</span>
                        <span className="font-medium text-ink-950">{p.percent}%</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {project.amenities.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold text-ink-950">{dict.newProjects.amenities}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.amenities.map((a) => (
                      <Badge key={a} variant="neutral">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div>
              <EnquiryForm projectId={project.id} heading={dict.newProjects.registerInterest} dict={dict} />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
