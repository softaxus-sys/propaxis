import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Every Qasro enquiry lands in one CRM instead of scattered emails and phone notes.",
  "Track each lead through Viewing → Offer → Deal on a visual pipeline, not a spreadsheet.",
  "See which agents respond fastest and close the most — team performance in one view.",
  "The same intake VRODUX already runs for Property Finder and Bayut, so every channel meets in one place.",
];

/**
 * Advertises VRODUX ERP on the agency dashboard so agencies discover and self-serve
 * sign up for it, independent of the automatic trial-provisioning flow triggered on
 * agency approval (see vrodux-integration/tenant-provisioning.ts). Shown only for
 * agencies that haven't connected a VRODUX tenant yet (checked by the caller) — once
 * connected/trialing, /agency/dashboard/vrodux is the source of truth for status.
 */
export function VroduxPromoCard({ recentLeadsCount }: { recentLeadsCount: number }) {
  return (
    <Card className="mt-10 overflow-hidden border-bronze-200 bg-gradient-to-br from-ink-950 to-ink-800 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <Badge variant="accent" className="bg-bronze-400/20 text-bronze-300 border-bronze-400/30">
            Run your business with VRODUX
          </Badge>
          <h2 className="mt-3 text-xl font-semibold">Turn your Qasro leads into closed deals</h2>
          <p className="mt-2 text-sm text-sand-200">
            {recentLeadsCount > 0
              ? `You've had ${recentLeadsCount} lead${recentLeadsCount === 1 ? "" : "s"} come in recently on Qasro. VRODUX is the CRM/ERP that turns them into a tracked pipeline instead of a list to chase manually.`
              : "VRODUX is the CRM/ERP built for real estate agencies — free to try, and every new Qasro lead can flow straight into it."}
          </p>

          <ul className="mt-5 space-y-2.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2.5 text-sm text-sand-100">
                <span aria-hidden className="mt-0.5 text-bronze-400">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:w-48">
          <a
            href="https://erp.vrodux.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "accent", size: "md" }), "w-full")}
          >
            Start free trial
          </a>
          <a
            href="https://vrodux.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full border-white/30 text-white hover:bg-white/10")}
          >
            Learn more about VRODUX
          </a>
        </div>
      </div>
    </Card>
  );
}
