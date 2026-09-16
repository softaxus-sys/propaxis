# PropAxis.ae — Architecture

> Real Estate Intelligence. Powered by AI.

Status: **core build complete** (phases 1–14, see §9) — marketplace, dashboards, AI tool-calling and the
VRODUX integration boundary are all wired up and verified against a live Postgres database. This document
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
| AI | Any OpenAI-compatible chat-completions endpoint (`AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY`) —
  defaults to Groq's free tier. **Function/tool calling only**: the model never fabricates property
  data, it calls structured tools that query Postgres and returns grounded results. |
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

PropAxis and VRODUX are **separate systems, separate databases**. VRODUX is itself multi-tenant, and the
connection is **per-agency, not global**: Softaxus's own internal VRODUX usage (tenant "Softaxus
Technologies") is unrelated to this entirely. Any PropAxis `Agency` that wants VRODUX signs up for its
own VRODUX tenant and connects it independently, from its own agency dashboard.

The actual mechanism is VRODUX's existing per-tenant **lead-intake webhook** — the same one VRODUX
already exposes for Property Finder, Bayut and plain web forms. An agency admin pastes that webhook URL
into `/agency/dashboard/vrodux` (stored as `Agency.vroduxWebhookUrl`); PropAxis then POSTs every new lead
for that agency's listings straight to it. No API key/OAuth needed — it's the same integration shape a
form builder would use. `src/modules/vrodux-integration/` is the only module allowed to know this:
`VroduxProvider` is the interface, `WebhookVroduxProvider` is the real (already-working) implementation,
and `NoOpVroduxProvider` is what an unconnected agency gets (leads simply stay in PropAxis only).

```
Agency connects its VRODUX webhook URL (per agency, one-time, in its own dashboard)
                            ↓
PropAxis Listing → Enquiry → PropAxis Lead → POST to that agency's VRODUX webhook
```

Webhooks are intake-only — there's no equivalent mechanism yet for syncing Opportunity/Deal stage
changes back into PropAxis, so `pushOpportunity`/`pushDeal` on `VroduxProvider` are no-ops today, kept
for if/when VRODUX exposes a bidirectional API.

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
| 8. Property search | ✅ `/buy`, `/rent`, `/commercial`, filters + pagination |
| 9. Property detail page | ✅ Property Passport (`/property/[id]`) |
| 10. Agent profiles | ✅ `/agents`, `/agents/[slug]`, `/agencies`, `/developers` |
| 11. Basic dashboards | ✅ user/agent/agency/developer/admin dashboards, listing + lead CRUD, verification queue |
| 12. PropAxis AI | ✅ tool-calling orchestrator + chat UI (`/ai-search`) — needs `AI_API_KEY` to actually answer |
| 13. Data/market intelligence | ✅ `/insights`, `/valuation`, `/investment-calculator` |
| 14. VRODUX integration | ✅ interface + `MockVroduxProvider`, wired into lead creation — real HTTP client still pending |

Everything above is verified against a live Postgres instance (Neon), including migration, seed, full
`next build`, and manual browser testing of search → property detail → login → listing creation → lead
capture → VRODUX mock sync. Remaining gaps: no real LLM key configured yet (AI degrades to a clear error
message rather than fabricating), Redis/OpenSearch aren't wired up (search runs directly against
Postgres, rate limiting is in-memory), and the real VRODUX HTTP client is still a TODO in
`src/modules/vrodux-integration/client.ts`.
