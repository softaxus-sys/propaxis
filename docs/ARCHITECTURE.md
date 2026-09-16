# PropAxis.ae — Architecture

> Real Estate Intelligence. Powered by AI.

Status: **early build** — foundational scaffold (auth, schema, design system, homepage). This document
is updated as each phase lands; it reflects what is actually implemented, not the aspirational end state.

## 1. Product shape

PropAxis is two things wearing one skin:

1. **Marketplace** — buyers/tenants/investors search and understand properties (Buy, Rent, New Projects,
   Commercial, Areas, Buildings, Projects, Agents, Agencies, Developers).
2. **Professional platform** — agents, agencies and developers manage listings, leads and clients, backed
   by an AI copilot, with business activity flowing into **VRODUX** (the group's ERP/CRM) through an
   integration boundary, never a shared database.

The unifying layer across both is **PropAxis Intelligence**: a structured data model (asking price vs.
transaction price vs. rental asking vs. rental transaction, kept strictly separate) that powers the
**Property Passport**, comparables, valuation ranges, and the AI assistant's tool-calling surface.

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS, design tokens in `src/styles/tokens.css` |
| ORM / DB | Prisma → PostgreSQL (+ PostGIS for geo) |
| Cache / queue | Redis |
| Search | OpenSearch/Elasticsearch (full-text + facets) |
| Vector search | pgvector or dedicated vector store, for AI semantic retrieval |
| Auth | Auth.js (NextAuth) v5, credentials + OAuth, JWT session, RBAC via `role` + `permissions` |
| AI | LLM API with **function/tool calling only** — the model never fabricates property data, it calls
  structured tools that query Postgres/OpenSearch and returns grounded results |
| Object storage | S3-compatible bucket for listing media |
| i18n | English + Arabic, full RTL support (`dir` attribute driven, logical CSS properties) |
| Infra | Docker, CI/CD (GitHub Actions), environment-based config |

## 3. Repository layout

```
propaxis/
├── docs/                        # architecture, ADRs
├── prisma/
│   └── schema.prisma             # single source of truth for the data model
├── src/
│   ├── app/                      # Next.js App Router routes (thin — delegate to modules)
│   │   ├── (marketing)/          # homepage, buy, rent, areas, agents, etc.
│   │   ├── (dashboard)/          # user/agent/agency/developer/admin dashboards
│   │   ├── api/                  # route handlers (REST/webhook endpoints)
│   │   └── ...
│   ├── modules/                  # domain modules — the real architecture boundary
│   │   ├── auth/
│   │   ├── users/
│   │   ├── properties/
│   │   ├── listings/
│   │   ├── agents/
│   │   ├── agencies/
│   │   ├── developers/
│   │   ├── projects/
│   │   ├── buildings/
│   │   ├── areas/
│   │   ├── transactions/
│   │   ├── search/
│   │   ├── ai/
│   │   ├── leads/
│   │   ├── crm/
│   │   ├── analytics/
│   │   ├── verification/
│   │   ├── admin/
│   │   └── vrodux-integration/
│   ├── components/               # shared design-system components (ui/)
│   ├── lib/                      # cross-cutting: db client, rbac, rate-limit, logger
│   └── styles/                   # tokens, globals
├── package.json
└── docker-compose.yml            # postgres, redis, opensearch for local dev
```

Each module under `src/modules/*` owns its own types, server actions/services, and (where relevant)
Prisma query helpers. Routes in `src/app` are thin — they call into modules rather than embedding
business logic. This is what keeps "AI copilot" and "marketplace" changes from colliding: both are
just callers of the same module services.

## 4. Data model — key rules

- `Property` is the physical asset (address, geo, specs). A `Listing` is a *commercial offer* against a
  property (for sale / for rent, asking price, status, agent). One property can have multiple historical
  listings.
- **Asking price ≠ transaction price ≠ rental asking price ≠ rental transaction price.** These are four
  distinct fields/tables (`Listing.askingPrice`, `Transaction.price`, `RentalListing.askingRent`,
  `RentalTransaction.rent`). Never collapse them — they answer different questions (what's it listed for
  vs. what did it actually sell/rent for) and the whole valuation feature depends on keeping them apart.
- `MarketMetric` is derived/aggregated (price/sqft trends, rental yield by area) — always computed from
  `Transaction`/`RentalTransaction` rows, never hand-entered.
- `Verification` tracks provenance and confidence per record (`source`, `verifiedAt`, `confidenceScore`)
  so the UI can always show a data-confidence badge instead of presenting scraped/demo data as fact.
- Demo/seed data is flagged (`isDemoData: Boolean`) at the row level and the UI must render a visible
  "Demo data" badge wherever it's shown — see §6.

Full field-level schema lives in `prisma/schema.prisma`, which is the source of truth; this doc describes
intent, not the field list, so it doesn't rot.

## 5. AI architecture

PropAxis AI does not free-generate property facts. It's a tool-calling loop:

```
User NL query
   → AI orchestrator (intent parse)
   → structured tool calls (searchProperties, getPropertyPassport, compareAreas,
      getComparables, estimateValuation, getMarketMetrics, ...)
   → tools query Postgres/OpenSearch/vector store
   → results fed back to the model
   → model composes a grounded natural-language answer, citing the underlying records
```

Tools live in `src/modules/ai/tools/*`, each with a Zod-validated input/output schema and a direct call
into the relevant module's service layer — so a tool can never see or return more than the calling user's
RBAC permissions already allow (important once AI tools start touching `crm`/`leads`, which is
VRODUX-adjacent business data).

The **AI Copilot** for professionals (listing descriptions, lead summaries, prioritization, market
reports) is a separate tool namespace scoped to the authenticated agent/agency's own data.

## 6. Data integrity policy

- No fabricated UAE market data. Anything not sourced from a real/licensed feed is explicitly labeled
  `isDemoData` and rendered with a "Development data" badge — this is non-negotiable per product spec.
- Data providers (government/open data, developer feeds, agency feeds) are integrated behind a
  `DataProvider` interface (`src/modules/properties/providers/*`) so a real feed can be swapped in
  without touching consuming code.

## 7. VRODUX integration

PropAxis and VRODUX are **separate systems, separate databases**. Integration is API/webhook-based via
`src/modules/vrodux-integration/`, which defines a `VroduxProvider` interface (create/update contact,
push lead, push opportunity, sync deal status) with a `MockVroduxProvider` for local dev and a place to
drop in the real client later. Flow:

```
PropAxis Listing → Enquiry → PropAxis Lead → [vrodux-integration] → VRODUX CRM
                                                                        ↓
                                                        Follow-up → Opportunity → Deal
                                                                        ↓
                                                        (status synced back into PropAxis Lead)
```

## 8. Security & RBAC

- Roles: `USER`, `AGENT`, `AGENCY_ADMIN`, `DEVELOPER`, `ADMIN` (extensible), enforced both at the
  route/middleware layer and again inside module services (defense in depth — never trust the route
  guard alone since server actions can be called directly).
- All mutating server actions validate input with Zod before touching Prisma.
- Rate limiting on public API routes (search, AI) via Redis token bucket.
- File uploads restricted by type/size, stored in object storage, never on the app server.
- Audit log table (`AuditLog`) records who changed what on sensitive entities (listings, verification,
  users).

## 9. Build phases (tracking)

| Phase | Status |
|---|---|
| 1. Inspect repo | ✅ |
| 2. Architecture doc | ✅ (this file) |
| 3. Database schema | ✅ initial `schema.prisma` |
| 4. Design system | ✅ tokens + base UI components |
| 5. Auth/RBAC | ✅ initial Auth.js + role model |
| 6. Homepage | ✅ initial build |
| 7. Property/listing models | ✅ (part of §3 schema) |
| 8. Property search | ⏳ not started |
| 9. Property detail page | ⏳ not started |
| 10. Agent profiles | ⏳ not started |
| 11. Basic dashboards | ⏳ not started |
| 12. PropAxis AI | ⏳ not started |
| 13. Data/market intelligence | ⏳ not started |
| 14. VRODUX integration | ⏳ interface only |
