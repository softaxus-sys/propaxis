# Qasro.com — SEO & CMS Implementation Report

**Date:** 2026-10-01. Companion to `seo-audit.md` (what was wrong, with evidence),
`seo-architecture.md` (the policy implemented), `cms-specification.md` (the CMS design
and phasing), and `seo-content-roadmap.md` (what to write next).

## What actually changed

Two commits, both pushed to `master` and live:

1. **`789ecb8`** area (go-live infra from the prior pass — email, CAPTCHA, rate
   limiting, Terms/Privacy) — not part of this SEO/CMS work, mentioned only for context.
2. **`603d29e`** — this pass. Full file list is in that commit's message; summary:
   - `src/app/robots.ts`, `src/app/sitemap.ts` (new)
   - `generateMetadata`/`metadata` added or fixed on 17 pages (6 previously had *zero*
     metadata export, 11 had only a bare `title`)
   - 4 new section `layout.tsx` files + 1 route-group layout, enforcing `noindex` on
     every private route by inheritance
   - JSON-LD: Organization + WebSite (global), RealEstateListing + BreadcrumbList
     (property pages), Article + BreadcrumbList (guides)
   - `src/components/marketing/property-gallery.tsx` — alt-text fixes
   - `prisma/schema.prisma` — `CmsPage`, `CmsPageRevision`, `Redirect` models
     (migration `20261001053537_cms_pages`, additive, applied to the live Neon database)
   - `src/modules/cms/*` (queries, actions, markdown rendering)
   - `src/app/admin/dashboard/content/**` (admin UI: list, create, edit, revisions)
   - `src/app/guides/**` (public rendering)
   - `src/app/list-your-property/**` (new advertiser landing page)
   - `src/app/api/cron/cms-publish/route.ts` + `vercel.json` (scheduled publishing)
   - New dependencies: `marked`, `isomorphic-dompurify`

## Migrations

One migration, `20261001053537_cms_pages` — three new tables
(`cms_pages`, `cms_page_revisions`, `redirects`), two new enums, no changes to any
existing column. Applied directly to the live Neon database (same one every prior
migration in this project has gone to) via `prisma migrate deploy`, and confirmed via
`prisma migrate status` equivalent (the deploy command itself reports success/failure;
it reported success). No data was deleted or altered by this migration — purely
additive.

## Tests run, and what that claim actually means

**This project has no automated test framework** — confirmed by checking
`package.json` (no `jest`/`vitest`/`playwright` script or dependency) before writing
anything. Part 8 of the brief says to "use the existing test framework"; there isn't
one to use, and standing up a full test framework plus a real test suite is its own
substantial project, not something to bolt on as a side effect of this pass. I'm
stating this plainly rather than fabricating a passing test suite.

What I actually ran and observed:
- `npx tsc --noEmit` — clean, zero errors, after every batch of changes in this pass.
- `npm run build` (full production build via Turbopack) — succeeded, all 47 routes
  (including the new ones) compiled and generated correctly.
- **Manual, scripted verification of the CMS pipeline specifically**, not just "it
  built": created one real draft `CmsPage` and confirmed via a direct script
  (not guessed, actually run and observed): (1) `getPublishedPageBySlug` correctly
  returns `null` for it while `status: DRAFT` — the noindex/draft gating that's
  central to the whole workflow actually works, not just compiles; (2) `renderCmsBody`
  correctly converts its Markdown to sanitized HTML.
- **Live HTTP verification** (curl against `www.qasro.com`) of the *before* state for
  every audit finding in `seo-audit.md`, before writing any fix — so the audit itself
  isn't speculative either.

What I did **not** run: no Lighthouse/PageSpeed pass, no accessibility scanner, no
Search Console validation of the new structured data (that requires the live deploy to
be picked up by Google's tools first — see "first actions" below).

## Update — follow-up pass (same day)

Four items from the list below were closed in a second pass, each verified with a real
scripted test, not just a clean build:

- ~~`Redirect` rows aren't served~~ — **Fixed.** `/guides/[slug]` now checks
  `getRedirectFor()` before `notFound()`. Verified by publishing a page, renaming its
  slug, and confirming the old URL's data resolves to the recorded redirect — then
  reverted the test state.
- ~~`next` critical RCE advisory~~ — **Fixed.** Patched 16.3.5 → 16.3.8 (patch-only,
  not a major bump). `npm audit` now reports 3 high (pre-existing, unrelated Prisma
  tooling advisories) instead of 3 high + 1 critical.
- ~~Only `ARTICLE` renders publicly~~ — **`COMMUNITY` now also wired.** `Area.cmsPageId`
  links an area to a `COMMUNITY` page; once published, it renders on `/areas/[slug]`
  and its SEO fields take priority. Verified by linking a real test page to Dubai
  Marina, confirming it rendered, then fully cleaning up. `BUILDING`/
  `DEVELOPER_PROFILE`/`AGENCY_PROFILE`/`AGENT_PROFILE`/`PROJECT` still follow — same
  pattern, not yet built, sequenced deliberately one at a time (see
  `cms-specification.md` §C).

Still open, below, renumbered:

1. **CMS roles are ADMIN-only.** The workflow states exist, but there's no separate
   Editor/Author/Reviewer access — see `cms-specification.md` §F for why this was
   deliberately deferred rather than rushed. Still true; no value until a second real
   person needs content-only access — say the word if that's now the case.
2. ~~Media library doesn't exist~~ — **Built.** Real upload (not pasted URLs) via
   Contabo S3-compatible storage, wired into listing creation and the CMS editor's OG
   image field. See the dedicated commits for the Contabo-specific URL-format fix this
   needed.
3. **No rich-text editor** — Markdown only (see `cms-specification.md` §B.1 for the
   reasoning). Fine for a technical editor, friction for a non-technical one.
4. ~~`BUILDING`/`DEVELOPER_PROFILE`/`AGENCY_PROFILE`/`AGENT_PROFILE`/`PROJECT` CMS
   integration~~ — **`AGENCY_PROFILE`, `AGENT_PROFILE`, and `DEVELOPER_PROFILE` are now
   built**, same pattern as `COMMUNITY`, verified end-to-end for each. Still open:
   `BUILDING` (no public page exists to enrich at all — would need a new page built
   first, not just this pattern) and `PROJECT` (a real page exists at
   `/new-projects/[slug]`, just not wired up yet).
5. **Listing photo editing** — upload only works at listing creation time; no flow yet
   to add/remove/reorder photos on an existing listing.

## Manual setup steps required (things only you can do)

1. **Google Search Console**: verify `www.qasro.com` (DNS TXT record or HTML file,
   your choice), then submit `https://www.qasro.com/sitemap.xml`. This is also how
   you'll confirm the new structured data validates in the wild — Search Console's
   "Enhancements" reports pick up RealEstateListing/Article/BreadcrumbList over the
   following days.
2. **Bing Webmaster Tools**: same sitemap submission; Bing also lets you import
   verified Search Console properties directly, which is faster than re-verifying.
3. **GA4 conversion events**: Analytics is already firing (gtag.js, gated behind the
   cookie-consent banner from the prior pass). What's **not** done: marking "enquiry
   submitted," "agency registered," "agent registered" etc. as GA4 **conversion**
   events specifically (vs. just regular events) — that's a few clicks in the GA4 UI
   once you can see the events firing, not a code change.
4. **Verify the Vercel Hobby cron-job count limit** before relying on scheduled CMS
   publishing. This project already hit a deploy failure once this session from
   exceeding the cron *frequency* limit (see git history, "Fix vercel.json cron
   schedule for Hobby plan") — I'm fairly confident Hobby allows 2 cron jobs (this
   project now has exactly 2: Vrodux sync + CMS publish), but I'd rather you confirm
   this against Vercel's current published limits than have a third deploy failure
   from the same category of mistake.
5. **Legal/factual review** of any guide content before publishing — several roadmap
   items (tenant rights, buying process, transaction fees) need real RERA/DLD source
   verification that's outside this session's scope entirely.

## First actions for the Qasro team

1. Log into `/admin/dashboard/content` and look at the one draft page already created
   (`how-qasro-ai-works`) — it's a real, working example of the full pipeline, not
   published (by design). Publish it if you're happy with it, or use it as a template
   for the next one.
2. Do the Search Console + Bing Webmaster verification above — this is the thing that
   actually gets the new sitemap/metadata/structured data noticed by search engines;
   nothing in code makes that happen on its own.
3. Pick 2–3 rows from `seo-content-roadmap.md`'s Phase 2 (the community guides for
   Marina/Downtown/Palm Jumeirah, or the two P0 buying/renting guides) and get a real
   person — not an LLM — to source the facts, then use the CMS to draft, review, and
   publish them. This is the actual bottleneck going forward: the system to publish
   content now exists and works; writing accurate, non-fabricated content is a
   standing editorial job, not a one-time task.
4. Redirect serving is now fixed (see the update above) — no action needed here
   anymore, kept for history.
