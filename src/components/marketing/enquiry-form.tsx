"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/modules/leads/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

const initialState: EnquiryState = {};

export function EnquiryForm({
  listingId,
  projectId,
  agentId,
  heading,
  dict,
}: {
  listingId?: string;
  projectId?: string;
  agentId?: string;
  heading?: string;
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6">
        <p className="font-medium text-ink-950">{dict.common.enquirySentTitle}</p>
        <p className="mt-1 text-sm text-sand-600">{dict.common.enquirySentBody}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
      <h3 className="font-semibold text-ink-950">{heading ?? dict.property.interestedGetInTouch}</h3>
      {state.error && <p className="rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>}

      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {agentId && <input type="hidden" name="agentId" value={agentId} />}

      <Input name="name" required placeholder={dict.common.yourName} />
      <Input type="email" name="email" required placeholder={dict.common.email} />
      <Input type="tel" name="phone" placeholder={dict.common.phoneOptional} />
      <textarea
        name="message"
        rows={3}
        placeholder={dict.common.messagePlaceholder}
        className="w-full rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-sand-500 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.common.sending : dict.common.sendEnquiry}
      </Button>
    </form>
  );
}
