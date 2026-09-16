import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RegisterTabs } from "@/components/marketing/register-forms/register-tabs";
import { db } from "@/lib/db";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialTab = type === "agent" || type === "agency" ? type : "buyer";

  const agencies = await db.agency.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-ink-950">Create your account</h1>
          <div className="mt-5">
            <RegisterTabs initialTab={initialTab} agencies={agencies} />
          </div>
          <p className="mt-6 text-center text-sm text-sand-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
