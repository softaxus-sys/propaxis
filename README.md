# PropAxis.ae

**Real Estate Intelligence. Powered by AI.**

The UAE's AI-powered real estate marketplace and intelligence platform. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design, data model rules and build
phase tracking.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in secrets as needed
npm run db:up              # starts Postgres, Redis, OpenSearch via Docker
npm run db:migrate          # applies the Prisma schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma/PostgreSQL · Auth.js (RBAC) · Redis ·
OpenSearch — see `docs/ARCHITECTURE.md` §2 for the full list and rationale.

## Project structure

- `src/app` — routes (thin; delegate to modules)
- `src/modules` — domain modules (auth, properties, listings, agents, ai, crm, vrodux-integration, …)
- `src/components/ui` — design-system primitives
- `src/components/marketing` — homepage/marketing sections
- `prisma/schema.prisma` — source of truth for the data model

## Status

Early build. Demo/placeholder content is explicitly labeled "Demo data" in the UI and is never presented
as real UAE market data — see `docs/ARCHITECTURE.md` §6.
