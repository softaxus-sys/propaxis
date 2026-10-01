# Qasro.com — SEO Architecture & Indexation Policy

This documents the URL structure, canonical/indexation rules, sitemap composition, and
internal linking principles — the policy that `docs/seo-audit.md`'s fixes implement,
and that new pages should follow going forward.

## 1. URL structure

Qasro uses clean, lowercase, hyphenated paths with no file extensions or tracking
parameters baked into the path itself:

```
/                              homepage
/buy, /rent, /commercial       marketplace search (filters via query params)
/property/{id}                 listing detail (cuid, not a slug — see below)
/agents, /agents/{slug}        agent directory + profile
/agencies, /agencies/{slug}    agency directory + profile
/developers, /developers/{slug} developer directory + profile
/new-projects, /new-projects/{slug}  off-plan project directory + detail
/areas, /areas/{slug}          community/area directory + detail
/guides, /guides/{slug}        editorial articles (CMS, Phase 1)
/for-professionals             agent/agency/developer acquisition
/list-your-property            landlord/owner acquisition
/vrodux                        VRODUX CRM connection marketing
```

**Property URLs use the database id (`cmuo2w3we...`), not a slug.** This is an existing
convention, not something this pass changed — see "preserve existing URLs" in the
brief. A slugified alternative (`/property/{id}/{slug}`) would be more
human-readable and slightly better for anchor-text SEO, but changing it now means
redirecting every existing property URL. Noted as a **P2 candidate**, not done in this
pass, because the cost (redirect every live listing URL, including ones already
shared/bookmarked) doesn't clearly outweigh the benefit at current listing volume.

## 2. Canonical policy

- Every indexable page sets an explicit `alternates.canonical` pointing at its own
  clean URL on `https://www.qasro.com` (the canonical host — `qasro.com` apex 308s to
  `www`, confirmed live).
- Filtered/paginated variants of `/buy` and `/rent` canonicalize to the unfiltered base
  URL and additionally set `noindex` on themselves (see §3) — a `?bedrooms=2&areaSlug=x`
  URL is not meant to rank on its own, and must not dilute ranking signal away from the
  base page.
- CMS pages (`/guides/[slug]`) support an editor-set custom canonical
  (`CmsPage.canonicalUrl`) for the rare case content is deliberately syndicated/
  duplicated elsewhere — defaults to the page's own URL when unset.

## 3. Indexation policy — what's indexable and what isn't

**Indexable by default:**
- Homepage, `/buy`, `/rent`, `/commercial` (base URLs only, no filters)
- All directory pages (`/agents`, `/agencies`, `/developers`, `/areas`, `/new-projects`,
  `/guides`)
- Active listing detail pages (`status: ACTIVE`)
- Verified agent/agency profiles (`isVerified: true`) — an unverified agent/agency has
  no public value to show a searcher and isn't in the sitemap, though its page isn't
  robots-blocked outright (it 404s or shows nothing meaningful; verify this behavior
  as content scales — see §6).
- Developer profiles, project pages, area pages
- Published CMS pages with `noindex: false` (the default is `noindex: true` — a page
  must be explicitly opted in once it's actually ready, not indexed by omission)
- `/for-professionals`, `/list-your-property`, `/vrodux`, `/about`, `/contact`

**Never indexable** (enforced via `robots: {index: false}` on a section layout, so new
pages under these paths inherit it automatically rather than needing per-page opt-out):
- `/admin/**`, `/agent/dashboard/**`, `/agency/dashboard/**`, `/developer/dashboard/**`,
  `/dashboard` — all private, user-specific
- `/login`, `/register` — no unique content per visit; acquisition SEO value lives on
  the dedicated landing pages instead
- `/oauth/authorize` — server-to-server integration flow, never a search-intent page
- `/api/**` — not HTML, blocked at `robots.txt` level too

**Conditionally non-indexable:**
- `/buy`, `/rent` with any filter query param present
- Any CMS page while `status !== PUBLISHED`, or while `noindex: true` (the default)

## 4. Sitemap composition

`src/app/sitemap.ts`, regenerated hourly (ISR) rather than only at deploy time, so a
newly-synced Vrodux listing or newly-published guide appears within the hour rather
than waiting for the next deploy.

Included: the static page list above, every `ACTIVE` listing, every verified
agent/agency, every developer, every area, every project, every `PUBLISHED` +
non-`noindex` CMS guide. `lastmod` is the row's real `updatedAt` — never a fabricated
or "always today" timestamp.

Excluded: everything in the "never indexable" list above, draft/archived/scheduled CMS
pages, withdrawn (`status: WITHDRAWN`) or draft listings, unverified agents/agencies.

**Single file today, not a sitemap index.** Next's `sitemap.ts` caps out around 50,000
URLs per file; current volume (single digits of listings, a handful of directory
entries) is nowhere near that. **When total indexable URL count approaches ~10,000**
(a reasonable warning threshold well before the hard cap), switch to
`generateSitemaps()` for a proper index split by type (listings, guides, profiles) —
don't wait until the 50k file silently truncates.

## 5. Pagination & duplicate content

`/buy` and `/rent` paginate via `?page=N` through `searchListings` (`src/modules/
listings/search.ts`). Paginated pages beyond page 1 should carry `rel="next"`/`rel=
"prev"` link hints or at minimum stay `noindex` under the same filter-noindex rule
above — **currently, `page` is treated as a generic filter param and triggers noindex
like any other**, which is correct but worth being explicit about: a paginated page 2
of unfiltered `/buy` results is still noindex today. If deep pagination pages ever need
their own indexation (unlikely to be worth it), revisit this specifically.

## 6. Redirects

`Redirect` (Prisma model, `src/modules/cms/actions.ts`) exists for CMS slug changes —
when a published guide's slug changes, a 308 redirect from the old `/guides/{old-slug}`
to the new one is recorded automatically. **This table isn't wired into actual request
handling yet** — that requires either Next.js middleware consulting it on every request,
or a `redirects()` entry generated from it at build time. This is a **P1 gap**: the
`Redirect` rows are recorded correctly, but a visitor hitting an old guide URL today
gets a 404, not a 308. Wiring this is the next concrete step (see
`seo-implementation-report.md`'s outstanding issues).

Property/agent/agency/developer/area URLs are stable (keyed on database id/slug, never
regenerated), so this gap doesn't affect them today.

## 7. Internal linking

Existing patterns already link contextually (listing → agent profile, agent profile →
agency, area page → its listings) — this pass didn't need to add new internal links to
existing pages. New content (guides, `/list-your-property`) links back to the relevant
existing pages (e.g. `/list-your-property` links to `/for-professionals` for the
agent/agency audience instead of duplicating that content). As the guide content
roadmap (`seo-content-roadmap.md`) gets built out, each guide's "related pages" field
is exactly this: a deliberate internal-linking plan, not an afterthought.

## 8. Hreflang / locale

The site has English/Arabic infrastructure (`src/lib/i18n`), cookie-based locale
switching, not separate URL paths per locale (no `/ar/...` prefix). This means there
currently isn't a clean way to tell Google "this Arabic version is the Arabic
equivalent of this English URL" via `hreflang`, because they're the same URL. **This is
a real limitation for Arabic SEO** and is explicitly why the content roadmap's Phase 4
only adds Arabic *content* once URL-level locale support exists — adding `hreflang`
tags today would point at URLs that don't deterministically serve the stated language.
