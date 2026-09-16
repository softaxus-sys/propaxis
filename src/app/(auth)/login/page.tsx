import Link from "next/link";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const { redirect } = await import("next/navigation");
        redirect("/login?error=invalid");
      }
      throw err;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-ink-950">Sign in</h1>
          <p className="mt-1 text-sm text-sand-600">Access your PropAxis dashboard.</p>

          <SearchParamsError searchParams={searchParams} />

          <form action={login} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-950">Email</label>
              <Input type="email" name="email" required placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-950">Password</label>
              <Input type="password" name="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-sand-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-ink-950 underline underline-offset-4">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

async function SearchParamsError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p className="mt-4 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">
      Incorrect email or password.
    </p>
  );
}
