"use client";

import { updateOpportunityStage } from "@/modules/opportunities/actions";

const STAGES = ["QUALIFICATION", "VIEWING", "NEGOTIATION", "OFFER", "CLOSED_WON", "CLOSED_LOST"];

export function StageSelect({ opportunityId, stage }: { opportunityId: string; stage: string }) {
  return (
    <form
      action={(formData) => {
        void updateOpportunityStage(formData);
      }}
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <select
        name="stage"
        defaultValue={stage}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 w-full rounded-full border border-sand-300 bg-white px-2.5 text-xs font-medium text-ink-950"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
