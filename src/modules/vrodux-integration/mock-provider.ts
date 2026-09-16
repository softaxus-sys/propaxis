import type {
  VroduxProvider,
  VroduxLeadInput,
  VroduxOpportunityInput,
  VroduxDealInput,
  VroduxRef,
} from "./provider";

/**
 * Local-dev / no-API-key stand-in for the real VRODUX client. Logs what would have
 * been pushed and returns a deterministic fake ref id, so lead/opportunity/deal flows
 * can be built and tested end-to-end before the real integration exists.
 */
export class MockVroduxProvider implements VroduxProvider {
  async pushLead(input: VroduxLeadInput): Promise<VroduxRef> {
    console.log("[vrodux-integration:mock] pushLead", input);
    return { vroduxRefId: `mock-lead-${input.externalLeadId}` };
  }

  async pushOpportunity(input: VroduxOpportunityInput): Promise<VroduxRef> {
    console.log("[vrodux-integration:mock] pushOpportunity", input);
    return { vroduxRefId: `mock-opp-${input.externalOpportunityId}` };
  }

  async pushDeal(input: VroduxDealInput): Promise<VroduxRef> {
    console.log("[vrodux-integration:mock] pushDeal", input);
    return { vroduxRefId: `mock-deal-${input.externalDealId}` };
  }
}
