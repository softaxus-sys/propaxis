import Link from "next/link";
import { auth } from "@/auth";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/new-projects", label: "New Projects" },
  { href: "/commercial", label: "Commercial" },
  { href: "/areas", label: "Areas" },
  { href: "/agents", label: "Agents" },
  { href: "/insights", label: "Market Insights" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="PropAxis home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
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
          <Link href="/ai-search" className="hidden sm:block">
            <Button variant="accent" size="sm">
              Ask PropAxis AI
            </Button>
          </Link>
          {session?.user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
