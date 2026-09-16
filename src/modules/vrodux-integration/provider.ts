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

export type VroduxRef = { vroduxRefId: string };

/**
 * Everything PropAxis needs from VRODUX's CRM. A real implementation talks to the
 * VRODUX API over HTTP; `MockVroduxProvider` is the local-dev stand-in until that
 * client exists.
 */
export interface VroduxProvider {
  pushLead(input: VroduxLeadInput): Promise<VroduxRef>;
  pushOpportunity(input: VroduxOpportunityInput): Promise<VroduxRef>;
  pushDeal(input: VroduxDealInput): Promise<VroduxRef>;
}
