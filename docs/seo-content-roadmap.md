# Qasro.com — SEO Content Roadmap

**Important caveat, stated once here rather than on every row:** no paid keyword tool
(Ahrefs, SEMrush, Google Keyword Planner) was available this session. The "keyword"
and "priority" columns below are reasoned from search-intent logic and competitor
pattern-matching (what Property Finder/Bayut/Dubizzle structurally rank for), **not
measured search volume**. Treat them as a starting hypothesis to validate with real
keyword data before committing significant writing effort to lower-priority rows —
this is exactly the gap the brief asks to be honest about, not paper over.

All rows start at **status: Not started**. Nothing in this roadmap has been written —
building the system to publish content is this pass's job; writing dozens of
researched, non-fabricated articles is a separate, ongoing editorial effort that needs
a human source (market knowledge, actual UAE rental/mortgage rules, real developer
data) this session doesn't have.

Every page type listed has a working home to publish into: `ARTICLE` → `/guides/
[slug]` (CMS, built this pass). Community/developer/agency/agent "pages" in clusters
3, 7–11 below are mostly about **enriching existing pages** (`/areas/[slug]`,
`/developers/[slug]`, `/agencies/[slug]`, `/agents/[slug]`) with long-form content, not
new URLs — see `cms-specification.md` §C for why.

## Cluster 1 — UAE & emirate-level listing pages

| Topic | Audience | Primary keyword (reasoned) | Intent | URL | Priority | Conversion event |
|---|---|---|---|---|---|---|
| Properties for sale in Dubai | Seeker | "property for sale dubai" | Transactional | `/buy` (existing) | P0 | Enquiry |
| Properties for rent in Dubai | Seeker | "apartments for rent dubai" | Transactional | `/rent` (existing) | P0 | Enquiry |
| Properties for sale in Abu Dhabi | Seeker | "property for sale abu dhabi" | Transactional | `/buy?emirate=abu-dhabi` → needs a real emirate filter first | P2 | Enquiry |
| Dubai vs Abu Dhabi: where to buy | Seeker | "dubai vs abu dhabi property investment" | Informational/Commercial | `/guides/dubai-vs-abu-dhabi-property` | P2 | Guide → Buy |

*Abu Dhabi/other-emirate pages are blocked on the product actually having non-Dubai
inventory and an emirate filter — see `seo-audit.md`'s note on thin pages. Don't build
the URL before the inventory exists.*

## Cluster 2 — Property type & sale/rent landing pages

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| Apartments for sale in Dubai | Seeker | "apartments for sale dubai" | Transactional | `/buy?propertyType=APARTMENT` (existing filter, currently noindex per filter policy — consider a dedicated indexable landing page if this intent proves high-value) | P1 |
| Villas for sale in Dubai | Seeker | "villas for sale dubai" | Transactional | same pattern | P1 |
| Off-plan properties in Dubai | Seeker | "off plan properties dubai" | Transactional | `/new-projects` (existing) | P0 |
| Luxury properties in Dubai | Seeker | "luxury real estate dubai" | Transactional | `/guides/luxury-real-estate-dubai` + filter link | P2 |

## Cluster 3 — Community, neighbourhood & building pages

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| Dubai Marina guide | Seeker | "dubai marina apartments" | Informational+Transactional | `/areas/dubai-marina` (existing, enrich with CMS copy) | P1 |
| Downtown Dubai guide | Seeker | "downtown dubai property" | Same | `/areas/downtown-dubai` (existing) | P1 |
| Palm Jumeirah guide | Seeker | "palm jumeirah villas" | Same | `/areas/palm-jumeirah` (existing) | P1 |
| Business Bay guide | Seeker | "business bay apartments" | Same | `/areas/business-bay` (existing) | P2 |
| JVC guide | Seeker | "jumeirah village circle apartments" | Same | `/areas/jvc` (existing) | P2 |

*Every area above already exists as a route — the work is CMS-authored intro copy
(history, lifestyle, transport, price-range context) once the `Area.cmsPageId` link
described in `cms-specification.md` §C is built, not new pages. **Each one must have
real listing inventory before being promoted** — an area page with zero listings is
exactly the "empty location page" the brief says to avoid.*

## Cluster 4 — Buying, selling & renting guides

| Topic | Audience | Keyword | Intent | URL | Pillar | Priority |
|---|---|---|---|---|---|---|
| How to buy property in Dubai as a foreigner | Seeker | "buy property dubai foreigner" | Informational | `/guides/buy-property-dubai-foreigner` | Buying hub | P0 |
| Dubai property buying process, step by step | Seeker | "dubai property buying process" | Informational | `/guides/dubai-buying-process` | Buying hub | P0 |
| Tenant rights in Dubai (RERA rental law) | Seeker | "tenant rights dubai" | Informational | `/guides/tenant-rights-dubai` | Renting hub | P0 |
| How to sell your property in Dubai | Seeker | "sell property dubai" | Informational | `/guides/sell-property-dubai` | Selling hub | P1 |
| Renting process in Dubai, step by step | Seeker | "renting process dubai" | Informational | `/guides/dubai-renting-process` | Renting hub | P1 |

*These require real, current RERA/DLD rules — **source from DLD/RERA's own published
guidance**, not invented. Flag each as needing legal-accuracy review before publish,
same as the Terms/Privacy pages already shipped.*

## Cluster 5 — Investment, ROI, mortgage & cost guides

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| Dubai property transaction costs & fees explained | Seeker | "dubai property transaction fees" | Informational | `/guides/dubai-property-fees` | P0 |
| Mortgage for expats in the UAE | Seeker | "uae mortgage for expats" | Informational | `/guides/uae-mortgage-expats` | P1 |
| Rental yield by area in Dubai | Seeker | "best rental yield dubai areas" | Informational/Commercial | `/guides/dubai-rental-yield-by-area` | P1 — needs real yield data from `MarketMetric`, not invented figures |
| Golden Visa through property investment | Seeker | "dubai golden visa property investment" | Informational | `/guides/golden-visa-property-investment` | P2 |

## Cluster 6 — Developer, project & off-plan pages

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| [Developer name] profile + track record | Seeker | "[developer] projects dubai" | Commercial | `/developers/[slug]` (existing, enrich) | P1 |
| Off-plan payment plans explained | Seeker | "off plan payment plan dubai" | Informational | `/guides/off-plan-payment-plans` | P1 |
| Off-plan vs ready property: pros and cons | Seeker | "off plan vs ready property dubai" | Informational | `/guides/off-plan-vs-ready` | P2 |

## Cluster 7 — Real estate agency acquisition

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| For agencies (main acquisition page) | Advertiser | "real estate portal for agencies uae" | Commercial | `/for-professionals` (existing) | P0 — already live |
| How Qasro's agency verification works | Advertiser | n/a (owned-brand) | Informational | `/guides/agency-verification-qasro` | P2 |
| Connect your VRODUX CRM | Advertiser | n/a (owned-brand) | Informational | `/vrodux` (existing) | P0 — already live |

## Cluster 8 — Individual agent acquisition

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| For agents (main acquisition page) | Advertiser | "real estate agent portal uae" | Commercial | `/for-professionals` (existing) | P0 — already live |
| Why join Qasro as an independent agent | Advertiser | n/a (owned-brand) | Informational | `/guides/why-join-qasro-agent` | P2 |

## Cluster 9 — Property advertising / listing platform guides

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| List your property (main page) | Advertiser (owner) | "list my property dubai" | Commercial | `/list-your-property` (existing, built this pass) | P0 — already live |
| How listing verification works | Advertiser | n/a | Informational | `/guides/how-listing-verification-works` | P2 |

## Cluster 10 — Developer advertising / project promotion

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| For developers: list your project | Advertiser | "list off plan project uae portal" | Commercial | `/for-professionals#developers` (existing section) or a dedicated `/developers/advertise` if demand justifies splitting it out | P2 |

## Cluster 11 — Landlord & private-owner acquisition

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| List your property (shared with cluster 9) | Advertiser (owner) | "rent out my property dubai" | Commercial | `/list-your-property` (existing) | P0 |
| Landlord's guide to renting out in Dubai | Advertiser | "landlord guide dubai rental" | Informational | `/guides/landlord-guide-dubai` | P2 |

## Cluster 12 — Original research, market reports & calculators

| Topic | Audience | Keyword | Intent | URL | Priority |
|---|---|---|---|---|---|
| Qasro Dubai property market report (quarterly) | Seeker + Advertiser | "dubai property market report" | Informational | `/guides/dubai-market-report-q1-2027` | P1 — **only when backed by real `MarketMetric`/`Transaction` data**, never fabricated |
| Rental yield calculator | Seeker | "rental yield calculator dubai" | Tool/Commercial | `/investment-calculator` (existing) | P0 — already live |
| Mortgage affordability calculator | Seeker | "mortgage calculator dubai" | Tool | `/guides/mortgage-calculator` or extend `/investment-calculator` | P2 |

---

## Phased rollout (maps to Part 6 of the brief)

- **Phase 1 (this pass, weeks 3–4 equivalent):** technical foundation done
  (`seo-audit.md`), `/for-professionals` and `/list-your-property` already live,
  conversion tracking groundwork (GA4 already firing, see
  `seo-implementation-report.md`).
- **Phase 2 (weeks 5–8):** write and publish Cluster 3's top 3 community pages
  (Marina, Downtown, Palm Jumeirah — the areas with existing real listing inventory)
  and Cluster 4's two P0 guides (buying-as-foreigner, tenant rights). Requires a human
  editor sourcing real RERA/DLD content — this is the first real editorial work, not
  something to batch-generate.
- **Phase 3 (weeks 9–12):** remaining Cluster 4/5 guides, first developer profile
  enrichment, first market report **only if** real transaction data volume supports one.
- **Phase 4 (months 4–6):** expand community coverage as inventory grows, Arabic
  content **only once URL-level locale routing exists** (see `seo-architecture.md` §8 —
  publishing Arabic content at the same URL as English today would need `hreflang` that
  can't be made accurate), Search-Console-driven refreshes once there's enough indexed
  content to have query data to act on.

**Total candidate pages above: ~38**, within the brief's 30–50 target. Several are
"enrich an existing page" rather than "build a new URL" — intentional, since the brief
explicitly warns against doorway pages and mass-produced near-duplicates.
