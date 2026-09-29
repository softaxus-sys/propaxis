/**
 * HTTP client for the Vrodux "website" listings API an agency's Vrodux tenant exposes
 * once connected (see docs/ARCHITECTURE.md §7.2). This is the SAME endpoint Vrodux
 * already uses to power an agency's own public website, scoped server-side by Vrodux
 * to "properties this agency checked as public/published" — Qasro never sees anything
 * beyond that.
 *
 * Field names below (`VroduxProperty`) are UNCONFIRMED — see the big warning in
 * listing-sync.ts before changing the mapping.
 */

const VRODUX_API_HOST = () => process.env.VRODUX_API_HOST || "https://erp.vrodux.com";

export class VroduxUnauthorizedError extends Error {
  constructor() {
    super("Vrodux rejected this agency's API key (401) — it was likely rotated or revoked on their side.");
    this.name = "VroduxUnauthorizedError";
  }
}

async function vroduxFetch(url: string, apiKey: string, { retries = 2 }: { retries?: number } = {}): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { "X-Api-Key": apiKey }, signal: AbortSignal.timeout(15_000) });
    } catch (err) {
      // Network error/timeout — treat as transient, retry with backoff.
      lastError = err;
      if (attempt < retries) await sleep(backoffMs(attempt));
      continue;
    }

    if (res.status === 401) {
      throw new VroduxUnauthorizedError();
    }

    if (res.ok) {
      return res.json();
    }

    if (res.status >= 500 && attempt < retries) {
      lastError = new Error(`Vrodux responded ${res.status} for ${url}`);
      await sleep(backoffMs(attempt));
      continue;
    }

    // 4xx other than 401 — not retryable, and not a "reconnect needed" case either.
    throw new Error(`Vrodux responded ${res.status} for ${url}`);
  }

  throw lastError instanceof Error ? lastError : new Error(`Vrodux request failed for ${url}`);
}

function backoffMs(attempt: number): number {
  return 500 * 2 ** attempt; // 500ms, 1s, 2s, ...
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Minimal shape we rely on — everything else passes through as `unknown` until the
 * mapping in listing-sync.ts is verified against a real payload. */
export type VroduxCompany = Record<string, unknown>;
export type VroduxProperty = Record<string, unknown> & { id?: unknown; propertyId?: unknown };

export async function fetchVroduxCompany(listingsApiBaseUrl: string, apiKey: string): Promise<VroduxCompany> {
  const data = await vroduxFetch(`${VRODUX_API_HOST()}${listingsApiBaseUrl}/company`, apiKey);
  return (data ?? {}) as VroduxCompany;
}

export async function fetchVroduxProperties(listingsApiBaseUrl: string, apiKey: string): Promise<VroduxProperty[]> {
  const data = await vroduxFetch(`${VRODUX_API_HOST()}${listingsApiBaseUrl}/properties`, apiKey);
  if (Array.isArray(data)) return data as VroduxProperty[];
  // Some list APIs wrap the array in an envelope (e.g. { data: [...] }) — accept that
  // shape too since we don't have a confirmed real payload to pin this down exactly.
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as Record<string, unknown>).data as VroduxProperty[];
  }
  throw new Error("Unexpected /properties response shape from Vrodux (expected an array).");
}
