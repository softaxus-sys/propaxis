import type { VroduxProvider, VroduxRef } from "./provider";

/**
 * Used when an Agency hasn't connected its own VRODUX tenant. Pushing is opt-in per
 * agency (see docs/ARCHITECTURE.md §7) — no connection means the lead simply stays in
 * PropAxis only, silently, rather than erroring or pushing anywhere.
 */
export class NoOpVroduxProvider implements VroduxProvider {
  async pushLead(): Promise<VroduxRef> {
    return { vroduxRefId: "" };
  }

  async pushOpportunity(): Promise<VroduxRef> {
    return { vroduxRefId: "" };
  }

  async pushDeal(): Promise<VroduxRef> {
    return { vroduxRefId: "" };
  }
}
