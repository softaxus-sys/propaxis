import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { getDictionary } from "@/lib/i18n/server";

export async function SiteFooter() {
  const dict = await getDictionary();

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: dict.footer.exploreTitle,
      links: [
        { href: "/buy", label: dict.footer.buy },
        { href: "/rent", label: dict.footer.rent },
        { href: "/new-projects", label: dict.footer.newProjects },
        { href: "/commercial", label: dict.footer.commercial },
        { href: "/areas", label: dict.footer.areas },
      ],
    },
    {
      title: dict.footer.professionalsTitle,
      links: [
        { href: "/agents", label: dict.footer.findAgent },
        { href: "/agencies", label: dict.footer.agencies },
        { href: "/developers", label: dict.footer.developers },
        { href: "/for-professionals", label: dict.footer.listWithPropaxis },
      ],
    },
    {
      title: dict.footer.intelligenceTitle,
      links: [
        { href: "/insights", label: dict.footer.marketInsights },
        { href: "/valuation", label: dict.footer.propertyValuation },
        { href: "/investment-calculator", label: dict.footer.investmentCalculator },
        { href: "/ai-search", label: dict.footer.propaxisAi },
      ],
    },
    {
      title: dict.footer.companyTitle,
      links: [
        { href: "/about", label: dict.footer.about },
        { href: "/vrodux", label: dict.footer.vroduxForBusiness },
        { href: "/contact", label: dict.footer.contact },
      ],
    },
  ];

  return (
    <footer className="border-t border-sand-200 bg-ink-950 text-sand-200">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-400">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-sand-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <Logo mark="dark" className="text-white" />
          <p className="text-xs text-sand-400">
            © {new Date().getFullYear()} PropAxis.ae. {dict.footer.demoDataNotice}
          </p>
        </div>
      </Container>
    </footer>
  );
}
