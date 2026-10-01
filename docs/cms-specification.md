# Qasro.com — CMS Specification

Reuses the existing stack end to end — Prisma/Postgres (same Neon database, no new
infrastructure), Auth.js (same session/role system, no parallel auth), the existing
design system components (`Card`, `Button`, `DashboardShell`). No new database, no new
auth system, no new hosting. This is a deliberate choice per the brief's "don't
introduce unnecessary infrastructure" instruction.

**Status markers below:** ✅ built and working · 📋 specified, not built yet.

## A. Dashboard

✅ `/admin/dashboard` shows draft/in-review/scheduled/published counts (reusing
`cmsDashboardCounts()`), linking to the content manager. 📋 A dedicated "SEO issues
needing review" panel (e.g. pages missing a meta description, pages with `noindex`
left on past their publish date) — straightforward to add once there's enough content
volume to make it worth surfacing; not built now because there's no content yet to
have issues.

## B. Page and content management

✅ Create, edit, publish, unpublish, archive — `/admin/dashboard/content`,
`src/modules/cms/actions.ts`. ✅ Draft → In Review → Approved → Scheduled → Published →
Archived status workflow (`CmsPageStatus` enum). ✅ Author, reviewer, editorial notes,
created/updated timestamps. ✅ Full revision history with restore (each save snapshots
the *current* state before overwriting, so restore is itself undoable — see
`CmsPageRevision`). 📋 Markdown is the content format, not a rich-text/WYSIWYG editor —
see §B.1. 📋 "Preview unpublished content securely" — today an admin previews a draft by
opening `/admin/dashboard/content/{id}` (which shows the raw fields); there's no
separate rendered preview matching the live `/guides/[slug]` template. 📋 Reusable page
templates/sections — not built; each `CmsPage` is independent content today.

### B.1 Why Markdown, not a rich-text editor

A full WYSIWYG editor (TipTap, Lexical, etc.) is a substantial separate integration —
schema for structured content blocks, a client-side editor bundle, image upload
handling inside the editor, serialization format. Markdown in a `<textarea>`, rendered
to sanitized HTML at request time (`src/modules/cms/render.ts`, via `marked` +
`isomorphic-dompurify`), covers headings, lists, links, tables, images, blockquotes,
and code — everything the brief's content types actually need — at a fraction of the
engineering cost and risk. **This is the one explicit scope reduction in this pass**:
upgrading to a rich-text editor is a reasonable Phase 2 if non-technical editors find
Markdown too friction-y, but isn't a blocker for shipping real content today.

## C. Content types

`CmsPageType` enum: `LANDING`, `ARTICLE`, `COMMUNITY`, `BUILDING`, `DEVELOPER_PROFILE`,
`PROJECT`, `AGENCY_PROFILE`, `AGENT_PROFILE`. ✅ `ARTICLE` is fully wired end to end
(editor → workflow → public render at `/guides/[slug]`). ✅ `COMMUNITY` is now wired too
(see below). 📋 The remaining five types exist in the schema (so wiring them up later is
a routing/template + one-FK change, not a new migration pattern) but aren't publicly
rendered yet.

**Why `COMMUNITY` is an enrichment, not a new URL — and how it's actually wired:** the
brief itself says "do not create duplicate property, agent or agency records if
equivalent entities already exist... integrate the CMS with the current source of
truth." Qasro already has a real `Area` model with its own detail page (`/areas/
[slug]`) backed by real relational data (listings, market metrics). A `COMMUNITY`-type
`CmsPage` **enriches** that existing page rather than existing as a separate competing
URL: `Area.cmsPageId` (nullable, unique FK) optionally points at one. Once that linked
page is `PUBLISHED`, `/areas/[slug]` renders its Markdown body as long-form content
(neighborhood guide copy, "what it's like to live here") alongside the existing
stats/listings, and its `seoTitle`/`seoDescription`/`canonicalUrl` take priority over
the mechanically-derived metadata the page already had. The admin editor shows an Area
picker only when a page's type is `COMMUNITY`; linking, relinking to a different area,
and unlinking are all handled (`syncAreaLink()` in `src/modules/cms/actions.ts`).
Verified end-to-end with a real scripted test, not just assumed from the code.

**`BUILDING`/`DEVELOPER_PROFILE`/`AGENCY_PROFILE`/`AGENT_PROFILE`/`PROJECT` follow the
exact same pattern** (one nullable+unique FK on the respective model) but aren't built
yet — deliberately sequenced one type at a time rather than all five at once, so each
integration gets verified against its own real page rather than batched and rushed.

## D. SEO fields

All ✅, on `CmsPage` directly: `seoTitle`, `seoDescription`, `canonicalUrl`,
`noindex` (default `true` — see below), `ogTitle`, `ogDescription`, `ogImageUrl`,
slug with collision detection (`isSlugAvailable`), automatic redirect recording on a
published page's slug change. ✅ Search-snippet preview in the editor UI (shows the
title/URL/description the way a search result would render). 📋 Breadcrumb
*configuration* — breadcrumbs render automatically (home → guides → page) on
`/guides/[slug]`, but there's no editor control to customize them; not needed until a
content type with a deeper hierarchy (e.g. nested guide categories) exists. 📋 Internal
link recommendations / related-content picker — not built; today an editor adds
related links by hand in the Markdown body.

**`noindex` defaults to `true`, not `false`.** A new page is only indexable once an
editor explicitly turns it off — this directly satisfies "do not allow editors to
accidentally index" thin/unfinished content, by making the safe state the default
rather than relying on editors remembering to check a box.

## E. Media library

📋 **Not built.** The brief's own go-live checklist (carried over from earlier in this
project's work) already identifies this as a separate, pre-existing gap: there's no S3
upload flow wired into any part of the app yet, CMS or otherwise (env vars for an
S3-compatible bucket exist in `.env.example` but nothing calls them). Building a proper
media library (upload, MIME/size/dimension validation, responsive variants, WebP/AVIF)
is real, standalone work that depends on S3 credentials existing first. Today, a CMS
page's `ogImageUrl` and any images referenced in Markdown body content are plain URLs
an editor pastes in (e.g. an already-hosted image, or a Vrodux-synced listing photo
URL) — functional for a first content phase, not a substitute for real media
management.

## F. User roles and security

✅ Server-side enforcement (`requireAdmin()` in `src/modules/cms/actions.ts`, checked
on every mutating action — never trust a client-side role check alone, same rule as
the rest of this app's RBAC). ✅ Audit log entries on every create/update/publish/
unpublish/archive/approve/schedule/restore/delete, reusing the existing polymorphic
`AuditLog` table rather than a parallel one. ✅ Markdown body sanitized through
DOMPurify at render time, not trust-on-write. ✅ Rate limiting and CAPTCHA already
exist on this app's public-facing forms (unrelated to the CMS, which has no public
write surface). 📋 **Gated entirely behind the existing `ADMIN` role today — no
separate Editor/Author/Reviewer roles yet.** The workflow states (Draft → In Review →
Approved → Published) exist in the data model and the UI exposes the transitions, but
since only `ADMIN` can do any of them right now, the review step is procedural, not
access-controlled. Adding `EDITOR`/`AUTHOR`/`REVIEWER` to the `Role` enum is a small,
low-risk follow-up (an enum extension, not a new table) — deliberately not done in this
pass because it has no value until there's a second real person who needs
content-only access, and extending a `Role` enum used throughout the app's existing
RBAC (`src/modules/auth/rbac.ts`) deserves its own focused review rather than being a
rushed side effect here.

## G. Editorial operations

✅ Search and filter by status/type/search term. ✅ Scheduled publishing, via a daily
cron sweep (`/api/cron/cms-publish`) — **once a day, not at the exact scheduled
minute**, because this project is on Vercel Hobby, which caps cron jobs at once daily
each (this is the project's *second* cron job, alongside the existing Vrodux sync — see
that route's comment for the same constraint hit before). ✅ Validation errors surface
inline in the editor form. ✅ `revalidatePath` is called on publish/unpublish so the
live page and sitemap reflect changes without waiting for a full redeploy. 📋 A
dedicated "preview before publish" view distinct from the edit form — not built (see
§B). 📋 Autosave — explicitly not added, per the brief's own instruction to only add it
"if it can be implemented reliably"; doing it properly needs debounced saves and
conflict handling that wasn't worth rushing into this pass.

## H. Data model

```
CmsPage          — the page/article itself, all SEO fields, status, author/reviewer
CmsPageRevision  — full-snapshot history, one row per save, restorable
Redirect         — fromPath → toPath records (slug-change tracking; see
                   seo-architecture.md §6 for the gap in actually serving these)
```

Full field list: `prisma/schema.prisma`, search for "CMS — editorial content".
