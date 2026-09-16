"use client";

import { updateLeadStatus } from "@/modules/leads/actions";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATING", "WON", "LOST"];

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  return (
    <form
      action={(formData) => {
        void updateLeadStatus(formData);
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-full border border-sand-300 bg-white px-2.5 text-xs font-medium text-ink-950"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
