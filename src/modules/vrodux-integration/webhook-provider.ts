import type { VroduxProvider, VroduxLeadInput, VroduxRef } from "./provider";

/**
 * Real VRODUX integration: POSTs to the agency's per-tenant VRODUX lead-intake
 * webhook — the same mechanism VRODUX already exposes for Property Finder, Bayut and
 * plain web forms. The payload shape below is our best guess at a generic lead-intake
 * body; adjust field names to match VRODUX's actual documented webhook schema once
 * available (see docs/ARCHITECTURE.md §7).
 *
 * Webhooks are one-directional (intake only) — there's no equivalent mechanism for
 * pushing Opportunity/Deal stage changes back, so those methods are no-ops here.
 */
export class WebhookVroduxProvider implements VroduxProvider {
  constructor(private readonly webhookUrl: string) {}

  async pushLead(input: VroduxLeadInput): Promise<VroduxRef> {
    const res = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.contact.name,
        email: input.contact.email,
        phone: input.contact.phone,
        source: input.source,
        subject: input.subject,
        message: input.message,
        agentEmail: input.agentEmail,
        externalRef: input.externalLeadId,
      }),
    });

    if (!res.ok) {
      throw new Error(`VRODUX webhook responded ${res.status}`);
    }

    const refId = await res
      .json()
      .then((body: unknown) => (typeof body === "object" && body && "id" in body ? String((body as { id: unknown }).id) : ""))
      .catch(() => "");

    return { vroduxRefId: refId };
  }

  async pushOpportunity(): Promise<VroduxRef> {
    return { vroduxRefId: "" };
  }

  async pushDeal(): Promise<VroduxRef> {
    return { vroduxRefId: "" };
  }
}
