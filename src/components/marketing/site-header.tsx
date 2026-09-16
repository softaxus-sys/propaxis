import Link from "next/link";
import { auth } from "@/auth";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { getLocale, getDictionary } from "@/lib/i18n/server";

export async function SiteHeader() {
  const [session, locale, dict] = await Promise.all([auth(), getLocale(), getDictionary()]);

  const navLinks = [
    { href: "/buy", label: dict.nav.buy },
    { href: "/rent", label: dict.nav.rent },
    { href: "/new-projects", label: dict.nav.newProjects },
    { href: "/commercial", label: dict.nav.commercial },
    { href: "/areas", label: dict.nav.areas },
    { href: "/agents", label: dict.nav.agents },
    { href: "/insights", label: dict.nav.insights },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="PropAxis home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-800 transition-colors hover:text-bronze-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link href="/ai-search" className="hidden sm:block">
            <Button variant="accent" size="sm">
              {dict.nav.askAi}
            </Button>
          </Link>
          {session?.user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                {dict.nav.dashboard}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {dict.nav.signIn}
              </Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
