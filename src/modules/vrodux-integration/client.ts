import type { VroduxProvider } from "./provider";
import { WebhookVroduxProvider } from "./webhook-provider";
import { NoOpVroduxProvider } from "./noop-provider";

export type AgencyVroduxConnection = {
  vroduxWebhookUrl: string | null;
};

/**
 * Resolves the VRODUX provider for a specific Agency. VRODUX is multi-tenant, and
 * connecting it is per-agency, not global: each agency that wants VRODUX signs up for
 * its own VRODUX tenant and pastes that tenant's lead-intake webhook URL into its
 * PropAxis agency settings (see src/app/agency/dashboard/vrodux) — this has nothing to
 * do with whichever tenant Softaxus uses for its own internal VRODUX usage. An agency
 * with no webhook configured gets `NoOpVroduxProvider` (leads stay in PropAxis only).
 * See docs/ARCHITECTURE.md §7.
 */
export function getVroduxProvider(connection: AgencyVroduxConnection | null | undefined): VroduxProvider {
  if (!connection?.vroduxWebhookUrl) {
    return new NoOpVroduxProvider();
  }

  return new WebhookVroduxProvider(connection.vroduxWebhookUrl);
}
