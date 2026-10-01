# Qasro.com — SEO & Technical Audit

**Audited:** 2026-10-01. **Method:** live HTTP checks against `https://www.qasro.com`
(curl — status codes, raw server-rendered HTML, headers) plus direct repository
inspection. No browser extension was available this session, so no in-browser
JS-rendering, Core Web Vitals (field data), or visual check was performed — those are
flagged explicitly below as **not verified**, not assumed fine.

Every finding below is either **Verified live** (I made the HTTP request myself and
saw the result), **Verified in code** (confirmed by reading the source, not yet
re-checked live), or **Not verified** (requires tooling/access this session didn't
have — Search Console, CrUX, a real browser, paid keyword tools). Nothing here is
inferred or assumed.

## P0 — severe, fixed in this pass

| # | Finding | Evidence | Status |
|---|---|---|---|
| 1 | No `robots.txt` at all | `curl -I https://www.qasro.com/robots.txt` → `404`, serving Next's default 404 page | **Fixed** — `src/app/robots.ts` |
| 2 | No `sitemap.xml` at all | Same check, `404` | **Fixed** — `src/app/sitemap.ts`, hourly ISR |
| 3 | Every property detail page shares the site-wide default title/description | `curl https://www.qasro.com/property/<id>` → `<title>Qasro.com — The Home Of Palaces</title>`, despite the page's own H1 reading a real listing title | **Fixed** — `generateMetadata` added |
| 4 | Same issue on every other dynamic detail page type | Confirmed no `generateMetadata`/`metadata` export at all in `agents/[slug]`, `agencies/[slug]`, `developers/[slug]`, `areas/[slug]`, `new-projects/[slug]` (grep, zero matches before this pass) | **Fixed** |
| 5 | Every static/index page sets only a bare `title`, inheriting the homepage's description | Verified live on `/buy`, `/for-professionals`: identical `<meta name="description">` across unrelated pages | **Fixed** — unique description + canonical added to all 13 affected pages |
| 6 | Private pages (`/login`, dashboards) have no `noindex` and are currently indexable | `curl https://www.qasro.com/login` → no `noindex` meta, no `X-Robots-Tag` header | **Fixed** — section layouts with `robots: {index:false}` |
| 7 | No canonical tags anywhere on the site | grep across `src/app` for `rel="canonical"` / `alternates.canonical`: zero matches before this pass | **Fixed** on all pages touched above |
| 8 | No structured data (JSON-LD) anywhere | grep for `application/ld+json`: zero matches before this pass | **Fixed** — Organization + WebSite (global), RealEstateListing + BreadcrumbList (property pages), Article + BreadcrumbList (guides) |

## P1 — real, fixed in this pass

| # | Finding | Evidence | Status |
|---|---|---|---|
| 9 | `/buy` and `/rent` have no indexation control for filter/query-param variants | Code inspection: `searchParams` accepted, no `noindex` logic existed | **Fixed** — `generateMetadata` sets `noindex` when any filter param is present |
| 10 | Hero listing photo has no alt text and isn't crawlable by Google Images | It's a CSS `background-image` (for the gradient-overlay styling), which carries no `alt` by definition | **Fixed** — paired `sr-only <img>` added with real alt text |
| 11 | Thumbnail strip images had `alt=""` | Code inspection, `src/components/marketing/property-gallery.tsx` | **Fixed** (the lightbox filmstrip's decorative thumbnails were left as-is — already correctly labeled via their parent button, per WCAG) |
| 12 | Apex domain → `www` redirect | `curl -I https://qasro.com/` → `308` to `https://www.qasro.com/` | **Working correctly**, not a bug — noted for completeness since it matters for which canonical host everything else assumes |

## Rendering & crawlability — verified, not an issue

The site is Next.js App Router, server-rendered (`ƒ` dynamic routes per the build
output) — not a client-only SPA. Every page I checked returns full, meaningful HTML on
the initial server response (title, content, H1) before any JavaScript runs. This means
Googlebot does not depend on JS execution to see page content — a real and meaningful
positive finding, confirmed by reading the raw curl response, not just assumed from the
framework choice.

## Not verified this session (needs follow-up)

- **Core Web Vitals (LCP/INP/CLS) field data** — requires Search Console/CrUX access,
  which wasn't available. Do not treat this audit as having measured performance;
  it hasn't. Run PageSpeed Insights / Search Console's Core Web Vitals report once the
  domain has enough traffic for field data, or Lighthouse locally for lab data.
- **Keyword search volumes / ranking difficulty** — no paid keyword tool was used.
  `docs/seo-content-roadmap.md` is explicit that its priorities are reasoned from
  domain/intent logic, not measured demand.
- **Actual mobile rendering / visual layout** — no browser extension was connected this
  session; only server-rendered HTML was inspected via curl.
- **Backlink profile** — out of scope for a code audit; would need Ahrefs/Search
  Console data.
- **Existing indexation status in Google** — whether pages are *currently* indexed
  requires Search Console access (see `docs/seo-implementation-report.md`'s setup
  checklist).

## Decisions made, not issues

- **Duplicate-URL avoidance for advertiser pages.** Before building anything from
  Part 4 of the brief, I checked live status codes for all eight requested advertiser
  URLs. `/for-professionals` and `/vrodux` already exist and cover agents/agencies/
  developers and CRM-connection respectively — building `/advertise-with-us`,
  `/real-estate-agencies`, `/real-estate-agents`, `/real-estate-leads`, or
  `/property-portal-for-agents` as separate pages would duplicate/cannibalize them. I
  built exactly one genuinely new page, `/list-your-property`, for individual
  landlords/owners — the one audience the existing pages don't address. `/pricing`
  wasn't built: I have no confirmed real pricing tiers to put on it, and the brief
  explicitly says not to fabricate pricing.
- **`/register` set to `noindex`.** It's a generic tabbed form with no unique content
  per tab (client-side state, same URL) — a classic thin page. SEO value for "become an
  agent" / "list your property" search intent belongs on the dedicated landing pages,
  which now exist and are indexable.

## Things worth a maintainer's attention, not fixed here (out of scope for this pass)

- `next` has a **critical** RCE advisory in this project's current version (`npm audit`
  — unrelated to anything changed in this pass). Worth a dedicated upgrade, separately.
- Several area/community pages likely have zero or very few listings currently (not
  individually audited row-by-row) — the brief is explicit that a location page with no
  real inventory is a thin page that shouldn't be aggressively promoted/indexed-expanded
  until it has genuine content. See the content roadmap's phasing.
