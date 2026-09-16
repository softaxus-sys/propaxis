import Link from "next/link";
import { signOut } from "@/auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function DashboardShell({
  children,
  userName,
  roleLabel,
  nav,
}: {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  nav: { href: string; label: string }[];
}) {
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-sand-200 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-ink-800 hover:text-bronze-500">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink-950">{userName}</p>
              <p className="text-xs text-sand-500">{roleLabel}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </Container>
      </header>
      <Container className="py-8">{children}</Container>
    </div>
  );
}
