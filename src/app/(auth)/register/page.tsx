import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RegisterTabs } from "@/components/marketing/register-forms/register-tabs";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { isSafeInternalPath } from "@/lib/utils";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; agencyName?: string; callbackUrl?: string }>;
}) {
  const { type, agencyName, callbackUrl } = await searchParams;
  const initialTab = type === "agent" || type === "agency" ? type : "buyer";
  // `agencyName` prefills the agency form when arriving from /oauth/authorize's
  // `company_name` hint; `callbackUrl` (e.g. back to /oauth/authorize) carries through
  // to the "sign in" link so completing registration/approval returns to the original
  // request instead of dropping the user on the generic dashboard.
  const safeCallbackUrl = isSafeInternalPath(callbackUrl) ? callbackUrl : undefined;

  const [agencies, dict] = await Promise.all([
    db.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getDictionary(),
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-ink-950">{dict.auth.createAccountTitle}</h1>
          <div className="mt-5">
            <RegisterTabs
              initialTab={initialTab}
              agencies={agencies}
              dict={dict}
              defaultAgencyName={agencyName}
              callbackUrl={safeCallbackUrl}
            />
          </div>
          <p className="mt-6 text-center text-sm text-sand-600">
            {dict.auth.alreadyHaveAccount}{" "}
            <Link
              href={safeCallbackUrl ? `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}` : "/login"}
              className="font-medium text-ink-950 underline underline-offset-4"
            >
              {dict.auth.signIn}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
