import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/buy", label: "Buy" },
      { href: "/rent", label: "Rent" },
      { href: "/new-projects", label: "New Projects" },
      { href: "/commercial", label: "Commercial" },
      { href: "/areas", label: "Areas" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { href: "/agents", label: "Find an agent" },
      { href: "/agencies", label: "Agencies" },
      { href: "/developers", label: "Developers" },
      { href: "/for-professionals", label: "List with PropAxis" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/insights", label: "Market Insights" },
      { href: "/valuation", label: "Property Valuation" },
      { href: "/investment-calculator", label: "Investment Calculator" },
      { href: "/ai-search", label: "PropAxis AI" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About PropAxis" },
      { href: "/vrodux", label: "VRODUX for business" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-ink-950 text-sand-200">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {COLUMNS.map((col) => (
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
            © {new Date().getFullYear()} PropAxis.ae — Real Estate Intelligence. Powered by AI. Property
            data marked &ldquo;Demo data&rdquo; is illustrative only and does not represent real UAE
            listings or transactions.
          </p>
        </div>
      </Container>
    </footer>
  );
}
