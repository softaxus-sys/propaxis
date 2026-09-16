import { Card } from "@/components/ui/card";
import { formatAed } from "@/lib/utils";
import { StageSelect } from "./stage-select";
import { DealPanel } from "./deal-panel";
import { CreateOpportunityForm } from "./create-opportunity-form";
import type { PipelineOpportunity } from "@/modules/opportunities/queries";

const STAGE_LABELS: Record<string, string> = {
  QUALIFICATION: "Qualification",
  VIEWING: "Viewing",
  NEGOTIATION: "Negotiation",
  OFFER: "Offer",
  CLOSED_WON: "Closed won",
  CLOSED_LOST: "Closed lost",
};

const STAGE_ORDER = ["QUALIFICATION", "VIEWING", "NEGOTIATION", "OFFER", "CLOSED_WON", "CLOSED_LOST"];

type LeadWithoutOpportunity = {
  id: string;
  customer: { name: string | null; email: string };
  listing: { title: string } | null;
  project: { name: string } | null;
};

export function PipelineBoard({
  leadsWithoutOpportunity,
  byStage,
  showAgentName = false,
}: {
  leadsWithoutOpportunity: LeadWithoutOpportunity[];
  byStage: Record<string, PipelineOpportunity[]>;
  showAgentName?: boolean;
}) {
  return (
    <div className="space-y-8">
      {leadsWithoutOpportunity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Qualified leads not yet in the pipeline</h2>
          <Card className="mt-3 divide-y divide-sand-100">
            {leadsWithoutOpportunity.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
                  <p className="truncate text-sand-600">{lead.listing?.title ?? lead.project?.name ?? "General enquiry"}</p>
                </div>
                <CreateOpportunityForm leadId={lead.id} />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-ink-950">Pipeline</h2>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stage) => {
            const opportunities = byStage[stage] ?? [];
            const totalValue = opportunities.reduce((sum, o) => sum + Number(o.estValueAed ?? 0), 0);

            return (
              <div key={stage} className="w-64 shrink-0">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-ink-950">{STAGE_LABELS[stage]}</h3>
                  <span className="text-xs text-sand-500">{opportunities.length}</span>
                </div>
                {totalValue > 0 && (
                  <p className="px-1 text-xs text-sand-500">{formatAed(totalValue, { compact: true })}</p>
                )}

                <div className="mt-2 space-y-2">
                  {opportunities.map((opp) => (
                    <Card key={opp.id} className="p-3">
                      <p className="truncate text-sm font-medium text-ink-950">
                        {opp.lead.customer.name ?? opp.lead.customer.email}
                      </p>
                      <p className="truncate text-xs text-sand-600">
                        {opp.lead.listing?.title ?? opp.lead.project?.name ?? "General enquiry"}
                      </p>
                      {showAgentName && opp.lead.agent && (
                        <p className="truncate text-xs text-sand-500">{opp.lead.agent.user.name}</p>
                      )}
                      {opp.estValueAed && (
                        <p className="mt-1 text-xs font-medium text-ink-950">
                          {formatAed(Number(opp.estValueAed), { compact: true })}
                        </p>
                      )}
                      <div className="mt-2">
                        <StageSelect opportunityId={opp.id} stage={opp.stage} />
                      </div>
                      {opp.stage === "CLOSED_WON" && (
                        <DealPanel opportunityId={opp.id} deal={opp.deal} />
                      )}
                    </Card>
                  ))}
                  {opportunities.length === 0 && (
                    <p className="rounded-lg border border-dashed border-sand-300 p-3 text-center text-xs text-sand-400">
                      Empty
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
