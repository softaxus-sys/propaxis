"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUrlField } from "@/components/admin/image-url-field";
import type { CmsFormState } from "@/modules/cms/actions";
import type { CmsPage } from "@prisma/client";

const TYPES: CmsPage["type"][] = [
  "LANDING", "ARTICLE", "COMMUNITY", "BUILDING", "DEVELOPER_PROFILE", "PROJECT", "AGENCY_PROFILE", "AGENT_PROFILE",
];

type EntityOption = { id: string; label: string };

const ENTITY_PICKER: Partial<Record<CmsPage["type"], { label: string; publicPath: string }>> = {
  COMMUNITY: { label: "Area", publicPath: "/areas/[slug]" },
  AGENCY_PROFILE: { label: "Agency", publicPath: "/agencies/[slug]" },
  AGENT_PROFILE: { label: "Agent", publicPath: "/agents/[slug]" },
  DEVELOPER_PROFILE: { label: "Developer", publicPath: "/developers/[slug]" },
  PROJECT: { label: "Project", publicPath: "/new-projects/[slug]" },
  BUILDING: { label: "Building", publicPath: "/buildings/[slug]" },
};

export function CmsPageForm({
  action,
  page,
  entityOptionsByType,
  currentEntityId,
}: {
  action: (prev: CmsFormState, formData: FormData) => Promise<CmsFormState>;
  page?: CmsPage;
  /** One options list per linkable type — only the list matching the selected type is
   * ever shown. See docs/cms-specification.md §C. */
  entityOptionsByType?: Partial<Record<CmsPage["type"], EntityOption[]>>;
  currentEntityId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as CmsFormState);
  const [type, setType] = useState<CmsPage["type"]>(page?.type ?? "ARTICLE");
  const picker = ENTITY_PICKER[type];
  const entityOptions = picker ? entityOptionsByType?.[type] : undefined;

  return (
    <form action={formAction} className="mt-6 grid gap-8 lg:grid-cols-3">
      {state.error && (
        <p className="lg:col-span-3 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="space-y-4 lg:col-span-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as CmsPage["type"])}
            className="h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-sand-500">
            ARTICLE renders at /guides/[slug]; COMMUNITY/AGENCY_PROFILE/AGENT_PROFILE/
            DEVELOPER_PROFILE/PROJECT enrich an existing entity page instead (pick it
            below once selected) — see docs/cms-specification.md.
          </p>
        </div>

        {picker && entityOptions && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">{picker.label}</label>
            <select name="entityId" defaultValue={currentEntityId ?? ""} className="h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm">
              <option value="">— not linked —</option>
              {entityOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-sand-500">
              Once this page is PUBLISHED, its content renders on that {picker.label.toLowerCase()}&apos;s own page
              ({picker.publicPath}) — see docs/cms-specification.md §C.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Title</label>
          <Input name="title" required defaultValue={page?.title} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Slug</label>
          <Input name="slug" placeholder="auto-generated from title if left blank" defaultValue={page?.slug} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Excerpt</label>
          <Input name="excerpt" maxLength={300} defaultValue={page?.excerpt ?? ""} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Body (Markdown)</label>
          <textarea
            name="body"
            required
            rows={20}
            defaultValue={page?.body}
            className="w-full rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 font-mono text-sm text-ink-950 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10"
          />
          <p className="mt-1 text-xs text-sand-500">
            Rendered as sanitized HTML at request time — headings, lists, links, tables, images, blockquotes.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Editorial notes</label>
          <textarea
            name="editorialNotes"
            rows={3}
            defaultValue={page?.editorialNotes ?? ""}
            className="w-full rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
          <h3 className="text-sm font-semibold text-ink-950">SEO</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">SEO title (≤70 chars)</label>
              <Input name="seoTitle" maxLength={70} defaultValue={page?.seoTitle ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">Meta description (≤160 chars)</label>
              <textarea
                name="seoDescription"
                maxLength={160}
                rows={2}
                defaultValue={page?.seoDescription ?? ""}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">Canonical URL (optional)</label>
              <Input name="canonicalUrl" type="url" defaultValue={page?.canonicalUrl ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-950">
              <input type="checkbox" name="noindex" defaultChecked={page?.noindex ?? true} />
              Noindex (default on — turn off only when this page is ready to be indexed)
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
          <h3 className="text-sm font-semibold text-ink-950">Social sharing</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">OG title</label>
              <Input name="ogTitle" maxLength={70} defaultValue={page?.ogTitle ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">OG description</label>
              <textarea
                name="ogDescription"
                maxLength={200}
                rows={2}
                defaultValue={page?.ogDescription ?? ""}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-600">OG image URL</label>
              <ImageUrlField name="ogImageUrl" defaultValue={page?.ogImageUrl ?? ""} />
            </div>
          </div>
        </div>

        {page?.seoTitle || page?.title ? (
          <div className="rounded-xl border border-sand-200 p-4">
            <h3 className="text-sm font-semibold text-ink-950">Search snippet preview</h3>
            <p className="mt-2 truncate text-base text-[#1a0dab]">{page?.seoTitle || page?.title}</p>
            <p className="text-xs text-[#006621]">
              {type === "ARTICLE" ? `www.qasro.com/guides/${page?.slug}` : `renders on the linked ${picker?.label.toLowerCase() ?? "page"}'s URL`}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-sand-700">{page?.seoDescription || page?.excerpt}</p>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
