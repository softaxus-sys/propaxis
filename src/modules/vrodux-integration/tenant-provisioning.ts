/**
 * Auto-provisions a VRODUX trial tenant for a newly-approved Qasro Agency, so an
 * agency doesn't have to separately sign up for VRODUX and paste a webhook URL to get
 * a working CRM. This is a DIFFERENT mechanism from the per-agency lead-intake webhook
 * in provider.ts/client.ts — that one pushes individual leads to an already-connected
 * tenant; this one creates the tenant itself.
 *
 * VRODUX (erp.vrodux.com) does not yet expose a tenant-provisioning API — this module
 * defines the contract Qasro needs and calls it once VRODUX_PROVISIONING_URL is set.
 * Until then, `requestVroduxTrial` fails fast with a clear "not configured" error
 * rather than silently pretending to succeed (unlike NoOpVroduxProvider for leads,
 * where "no connection" is a valid, expected state — an unconfigured trial API is not).
 *
 * Required VRODUX-side contract (to be implemented on erp.vrodux.com):
 *
 *   POST {VRODUX_PROVISIONING_URL}
 *   Headers: Authorization: Bearer {VRODUX_PROVISIONING_API_KEY}
 *   Body:    { externalRef, tenantName, adminName, adminEmail, adminPhone?, plan: "trial", trialDays }
 *   Returns: { tenantId, webhookUrl, loginUrl, trialEndsAt } (200) — must be idempotent
 *            on `externalRef` (a retry with the same Qasro Agency.id must not create a
 *            second tenant), and should error clearly (4xx/5xx + message) rather than
 *            partially provision.
 */

import { db } from "@/lib/db";

export type VroduxTrialRequest = {
  externalRef: string; // Qasro Agency.id — VRODUX must dedupe on this
  tenantName: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  trialDays: number;
};

export type VroduxTrialResult = {
  tenantId: string;
  webhookUrl: string;
  loginUrl?: string;
  trialEndsAt: string; // ISO date
};

export class VroduxProvisioningNotConfiguredError extends Error {
  constructor() {
    super("VRODUX trial provisioning isn't configured — VRODUX_PROVISIONING_URL/VRODUX_PROVISIONING_API_KEY are missing.");
    this.name = "VroduxProvisioningNotConfiguredError";
  }
}

export async function provisionVroduxTrial(input: VroduxTrialRequest): Promise<VroduxTrialResult> {
  const url = process.env.VRODUX_PROVISIONING_URL;
  const apiKey = process.env.VRODUX_PROVISIONING_API_KEY;

  if (!url || !apiKey) {
    throw new VroduxProvisioningNotConfiguredError();
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`VRODUX tenant provisioning responded ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as Partial<VroduxTrialResult>;
  if (!data.tenantId || !data.webhookUrl || !data.trialEndsAt) {
    throw new Error("VRODUX tenant provisioning returned an unexpected response shape.");
  }

  return {
    tenantId: data.tenantId,
    webhookUrl: data.webhookUrl,
    loginUrl: data.loginUrl,
    trialEndsAt: data.trialEndsAt,
  };
}

const DEFAULT_TRIAL_DAYS = 14;

/**
 * Orchestrates a trial request for one Agency: loads its admin contact, calls VRODUX,
 * and persists the result on Agency (vroduxTrialStatus/vroduxTrialTenantId/
 * vroduxTrialEndsAt, plus vroduxWebhookUrl so lead-push in provider.ts/client.ts picks
 * up the new tenant automatically — same field a manually-connected agency would fill
 * in). Called from verification/actions.ts on agency approval. Never throws — a failed
 * or unconfigured trial request must not block the approval itself; failures are
 * recorded on the Agency row and in AuditLog for an admin to see/retry.
 */
export async function requestVroduxTrial(agencyId: string, actorUserId: string): Promise<void> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: { agents: { include: { user: true } } },
  });
  if (!agency) return;

  // Trial already requested (active, provisioning, or previously failed-and-not-retried
  // yet) — this function is only meant to fire once per agency from the approval path.
  if (agency.vroduxTrialStatus !== "NONE") return;

  const admin = agency.agents.find((a) => a.user.role === "AGENCY_ADMIN")?.user ?? agency.agents[0]?.user;
  const adminEmail = admin?.email ?? agency.email;
  const adminName = admin?.name ?? agency.name;
  if (!adminEmail) return; // nothing to provision a tenant for

  await db.agency.update({
    where: { id: agencyId },
    data: { vroduxTrialStatus: "PROVISIONING", vroduxTrialStartedAt: new Date() },
  });

  try {
    const result = await provisionVroduxTrial({
      externalRef: agency.id,
      tenantName: agency.name,
      adminName,
      adminEmail,
      adminPhone: admin?.phone ?? agency.phone ?? undefined,
      trialDays: Number(process.env.VRODUX_TRIAL_DAYS) || DEFAULT_TRIAL_DAYS,
    });

    await db.agency.update({
      where: { id: agencyId },
      data: {
        vroduxTrialStatus: "ACTIVE",
        vroduxTrialTenantId: result.tenantId,
        vroduxTrialEndsAt: new Date(result.trialEndsAt),
        vroduxWebhookUrl: result.webhookUrl,
        vroduxConnectedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: actorUserId,
        action: "vrodux.trial_provisioned",
        entityType: "Agency",
        entityId: agencyId,
        metadata: { tenantId: result.tenantId, trialEndsAt: result.trialEndsAt },
      },
    });
  } catch (err) {
    await db.agency.update({ where: { id: agencyId }, data: { vroduxTrialStatus: "FAILED" } });

    await db.auditLog.create({
      data: {
        userId: actorUserId,
        action: "vrodux.trial_provision_failed",
        entityType: "Agency",
        entityId: agencyId,
        metadata: { error: err instanceof Error ? err.message : "unknown error" },
      },
    });
  }
}
