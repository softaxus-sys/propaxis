/**
 * HTTP client for the Vrodux "website" listings API an agency's Vrodux tenant exposes
 * once connected (see docs/ARCHITECTURE.md §7.2). This is the SAME endpoint Vrodux
 * already uses to power an agency's own public website, scoped server-side by Vrodux
 * to "properties this agency checked as public/published" — Qasro never sees anything
 * beyond that.
 *
 * CONFIRMED against a real response from erp.vrodux.com on 2026-09-30 (agency
 * cmumxxxdd0000kz040swh8fz5) — this is no longer the guesswork the original build had
 * to ship with. Real shape:
 *
 *   GET {listingsApiBaseUrl}/properties?page=1
 *   → { items: VroduxPropertyRaw[], page, pageSize, totalCount, totalPages, hasNext, hasPrev }
 *
 *   VroduxPropertyRaw = {
 *     id, reference, name, propertyType, address, city, emirate,
 *     totalArea, totalUnits, availableUnits, developer, description, publishedAt,
 *     imageUrls: string[]  ← RELATIVE paths (e.g. "/api/real-estate/website/images/...
 *                             ?exp=...&sig=..."), signed + expiring — see listing-sync.ts.
 *     units: VroduxUnitRaw[]
 *   }
 *   VroduxUnitRaw = {
 *     id, unitNumber, unitType, area, floor, rentPerYear, salePrice,
 *     furnishing, view, bedrooms, bathrooms, parking
 *   }
 *
 * i.e. one "property" is a BUILDING with potentially several units, each of which is
 * its own listing — not the flat one-row-per-listing shape originally assumed. See the
 * mapping in listing-sync.ts.
 */

const VRODUX_API_HOST = () => process.env.VRODUX_API_HOST || "https://erp.vrodux.com";

export function vroduxApiHost(): string {
  return VRODUX_API_HOST();
}

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

export type VroduxUnit = {
  id: string;
  unitNumber?: string | null;
  unitType?: string | null;
  area?: number | null;
  floor?: number | null;
  rentPerYear?: number | null;
  salePrice?: number | null;
  furnishing?: string | null;
  view?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
};

export type VroduxProperty = {
  id: string;
  reference?: string | null;
  name?: string | null;
  propertyType?: string | null;
  address?: string | null;
  city?: string | null;
  emirate?: string | null;
  totalArea?: number | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  developer?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  imageUrls?: string[] | null;
  units?: VroduxUnit[] | null;
};

type VroduxPropertiesPage = {
  items: VroduxProperty[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

function isPropertiesPage(data: unknown): data is VroduxPropertiesPage {
  return !!data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).items);
}

const MAX_PAGES = 200; // safety cap — 200 pages at Vrodux's own pageSize is far beyond any real agency

/** Fetches every page of an agency's published properties, following `hasNext` until
 * exhausted (or MAX_PAGES, as a guard against a runaway loop if Vrodux's pagination
 * ever misbehaves). */
export async function fetchVroduxProperties(listingsApiBaseUrl: string, apiKey: string): Promise<VroduxProperty[]> {
  const all: VroduxProperty[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const data = await vroduxFetch(`${VRODUX_API_HOST()}${listingsApiBaseUrl}/properties?page=${page}`, apiKey);

    if (Array.isArray(data)) {
      // Defensive fallback in case a future/other deployment returns a bare array.
      all.push(...(data as VroduxProperty[]));
      break;
    }

    if (!isPropertiesPage(data)) {
      throw new Error("Unexpected /properties response shape from Vrodux (expected { items: [...] }).");
    }

    all.push(...data.items);
    if (!data.hasNext) break;
    page++;
  }

  return all;
}
