/**
 * PropAxis and VRODUX are separate systems with separate databases — this module is
 * the only boundary between them. Nothing outside `vrodux-integration` should ever
 * import a VRODUX client directly. See docs/ARCHITECTURE.md §7.
 */

export type VroduxContactInput = {
  name: string;
  email: string;
  phone?: string;
};

export type VroduxLeadInput = {
  externalLeadId: string; // PropAxis Lead.id
  contact: VroduxContactInput;
  source: string; // e.g. "PropAxis Listing Enquiry"
  subject: string; // listing title / project name
  message?: string;
  agentEmail?: string;
};

export type VroduxOpportunityInput = {
  externalOpportunityId: string; // PropAxis Opportunity.id
  vroduxLeadRefId: string;
  stage: string;
  estValueAed?: number;
};

export type VroduxDealInput = {
  externalDealId: string; // PropAxis Deal.id
  vroduxOpportunityRefId: string;
  status: string;
  finalValueAed?: number;
};

/** `vroduxRefId` is best-effort — VRODUX's lead-intake webhook doesn't guarantee a
 * structured id back, so this is often empty even on a successful push. */
export type VroduxRef = { vroduxRefId: string };

/**
 * Everything PropAxis needs from VRODUX. `pushLead` is implemented today via VRODUX's
 * per-tenant lead-intake webhook (the same mechanism it already exposes for Property
 * Finder/Bayut/web forms — see WebhookVroduxProvider). `pushOpportunity`/`pushDeal`
 * are kept for a future bidirectional integration once VRODUX exposes an API for them;
 * a lead-intake webhook is one-directional and has no equivalent for those today.
 */
export interface VroduxProvider {
  pushLead(input: VroduxLeadInput): Promise<VroduxRef>;
  pushOpportunity(input: VroduxOpportunityInput): Promise<VroduxRef>;
  pushDeal(input: VroduxDealInput): Promise<VroduxRef>;
}
