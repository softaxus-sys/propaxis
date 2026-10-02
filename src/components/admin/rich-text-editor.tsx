"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { defaultMarkdownSerializer } from "prosemirror-markdown";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCmsImage } from "@/modules/cms/actions";

/** tiptap-markdown's Storage augmentation isn't picked up automatically — cast once
 * here rather than at every call site. */
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
}

/** @tiptap/extension-image has no markdown serializer of its own — tiptap-markdown
 * only knows how to serialize nodes that declare a `storage.markdown.serialize` spec
 * themselves (see its MarkdownSerializer.serializeNode). Without this, and with
 * `html: false` on the Markdown extension below (no raw-HTML fallback either), an
 * inserted image silently vanishes from the saved Markdown entirely — confirmed by
 * direct testing, not theoretical. prosemirror-markdown's own default image
 * serializer (`![alt](src "title")`) is exactly what tiptap-markdown's built-in Image
 * node uses internally; attaching it here to the actual Image instance in use (rather
 * than relying on tiptap-markdown's separate same-named shadow node, which doesn't
 * merge into this one) is what makes it apply. */
const MarkdownImage = Image.extend({
  addStorage() {
    return { markdown: { serialize: defaultMarkdownSerializer.nodes.image } };
  },
});

/** Hoisted to module scope deliberately — not an inline array inside useEditor's
 * options. TipTap v3's useEditor (with the default empty deps array) re-applies
 * editor.setOptions() on every render where it judges the options "changed," and its
 * extensions comparison is by reference per entry. `.configure(...)` returns a new
 * extension instance each call, so an inline `extensions: [..., Link.configure(...),
 * ...]` array is a *different* array, with different objects, on every single render —
 * which, combined with setUploading() re-rendering this component mid-upload,
 * reintroduces the original (unchanged) `content` option over the live document and
 * silently wipes whatever had been typed or inserted since mount. Confirmed by direct
 * testing (content vanished specifically after a state update occurred mid-async-flow,
 * not on the initial render), not theoretical. A stable, module-level array sidesteps
 * it entirely: same references every render, so the extensions comparison short-circuits
 * as unchanged and setOptions never re-fires. */
const EDITOR_EXTENSIONS = [
  StarterKit,
  Link.configure({ openOnClick: false, autolink: true }),
  MarkdownImage,
  Placeholder.configure({ placeholder: "Write the page content here…" }),
  Markdown.configure({ html: false, breaks: false, linkify: true }),
];

/**
 * WYSIWYG editor for CmsPage.body. The wire format stays Markdown — nothing else in
 * the pipeline changes: renderCmsBody() (marked + sanitize-html), revisions, excerpt
 * generation, and the search-snippet preview all keep reading/writing plain Markdown
 * exactly as before. The `Markdown` extension from tiptap-markdown handles both
 * directions (parses a Markdown string into the editor's content on mount, serializes
 * back to Markdown via `editor.storage.markdown.getMarkdown()` on every change) — so
 * this is purely a better authoring surface for the same stored format, not a new one.
 *
 * It keeps a hidden `<input name="body">` in sync with the editor's current Markdown,
 * so the surrounding `<form action={serverAction}>` (CmsPageForm) submits exactly the
 * way it always did — `formData.get("body")` still reads plain Markdown, no server
 * action changes needed. See src/components/ui/turnstile.tsx for the same
 * plain-form-compatible pattern used elsewhere in this app.
 */
export function RichTextEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  // The actual field the surrounding <form action={serverAction}> submits — a
  // *controlled* React value, not an imperatively-mutated ref. An earlier version set
  // a ref's `.value` directly from onUpdate; that write was reliably clobbered back to
  // empty shortly after an `await` (image upload) resumed and a sibling setState
  // (setUploading) re-rendered the tree — confirmed by direct, repeated testing, not
  // theoretical. Routing it through React state instead means every render paints the
  // current value, with nothing left for an unrelated re-render to stomp on.
  const [markdown, setMarkdown] = useState(defaultValue ?? "");
  // Captured synchronously at the moment the image button is clicked, before the
  // native file picker ever opens — see handleImageUpload for why this matters.
  const insertPosRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: EDITOR_EXTENSIONS,
    content: defaultValue ?? "",
    editorProps: {
      attributes: {
        // Same arbitrary-selector styling used to render published CmsPage bodies
        // publicly (see e.g. src/app/areas/[slug]/page.tsx) — matched here so editing
        // looks like the real output, not a generic textarea with different type sizes.
        class:
          "min-h-[20rem] space-y-3 px-3.5 py-2.5 text-sm leading-relaxed text-ink-950 focus:outline-none " +
          "[&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-950 " +
          "[&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-950 " +
          "[&_a]:text-bronze-600 [&_a]:underline [&_a]:underline-offset-4 " +
          "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mt-1 " +
          "[&_blockquote]:border-s-2 [&_blockquote]:border-sand-300 [&_blockquote]:ps-3 [&_blockquote]:text-sand-600 " +
          "[&_img]:rounded-lg [&_p.is-editor-empty:first-child::before]:float-start " +
          "[&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-sand-400 " +
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor }) => {
      setMarkdown(getMarkdown(editor));
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !editor) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadCmsImage(formData);
      if (result.url) {
        // Insert at the position captured when the button was clicked, not wherever
        // the "current" selection happens to be now. The native file picker (a real
        // OS-level dialog, not just a DOM blur) sits in the middle of this async gap —
        // confirmed by direct testing, ProseMirror's selection-on-refocus can come
        // back as "select everything," and setImage() at an implicit selection would
        // then replace the entire document with just the image instead of inserting it.
        const pos = insertPosRef.current ?? editor.state.doc.content.size;
        editor.chain().focus().insertContentAt(pos, { type: "image", attrs: { src: result.url } }).run();
        // onUpdate (above) handles this in the common case, but setting state again
        // here costs nothing and removes any doubt for this specific await-then-mutate
        // path.
        setMarkdown(getMarkdown(editor));
      } else if (result.error) {
        alert(result.error);
      }
    } finally {
      setUploading(false);
      insertPosRef.current = null;
    }
  }

  function handleImageButtonClick() {
    if (editor) insertPosRef.current = editor.state.selection.to;
  }

  return (
    <div className="rounded-lg border border-sand-300 bg-white focus-within:border-ink-700 focus-within:ring-2 focus-within:ring-ink-700/10">
      <Toolbar
        editor={editor}
        onImageUpload={handleImageUpload}
        onImageButtonClick={handleImageButtonClick}
        uploading={uploading}
      />
      <EditorContent editor={editor} />
      {/* The actual form field the server action reads — a controlled value kept in
          sync by the `markdown` state above, not an imperatively-mutated ref. */}
      <input type="hidden" name={name} value={markdown} readOnly />
    </div>
  );
}

function Toolbar({
  editor,
  onImageUpload,
  onImageButtonClick,
  uploading,
}: {
  editor: Editor | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageButtonClick: () => void;
  uploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttons: { icon: typeof Bold; label: string; active?: boolean; onClick: () => void }[] = editor
    ? [
        { icon: Bold, label: "Bold", active: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run() },
        { icon: Italic, label: "Italic", active: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run() },
        { icon: Heading2, label: "Heading 2", active: editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { icon: Heading3, label: "Heading 3", active: editor.isActive("heading", { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { icon: List, label: "Bullet list", active: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run() },
        { icon: ListOrdered, label: "Numbered list", active: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run() },
        { icon: Quote, label: "Quote", active: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run() },
        {
          icon: LinkIcon,
          label: "Link",
          active: editor.isActive("link"),
          onClick: () => {
            const url = window.prompt("Link URL", editor.getAttributes("link").href ?? "https://");
            if (url === null) return;
            if (url === "") editor.chain().focus().unsetLink().run();
            else editor.chain().focus().setLink({ href: url }).run();
          },
        },
      ]
    : [];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-sand-200 p-2">
      {buttons.map(({ icon: Icon, label, active, onClick }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-sand-600 hover:bg-sand-100 hover:text-ink-950",
            active && "bg-sand-200 text-ink-950"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}

      <button
        type="button"
        title="Insert image"
        aria-label="Insert image"
        disabled={uploading}
        onClick={() => {
          onImageButtonClick();
          fileInputRef.current?.click();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-sand-600 hover:bg-sand-100 hover:text-ink-950 disabled:opacity-50"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />

      <span className="mx-1 h-5 w-px bg-sand-200" />

      <button
        type="button"
        title="Undo"
        aria-label="Undo"
        onClick={() => editor?.chain().focus().undo().run()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-sand-600 hover:bg-sand-100 hover:text-ink-950"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Redo"
        aria-label="Redo"
        onClick={() => editor?.chain().focus().redo().run()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-sand-600 hover:bg-sand-100 hover:text-ink-950"
      >
        <Redo className="h-4 w-4" />
      </button>

      {uploading && <span className="ml-2 text-xs text-sand-500">Uploading…</span>}
    </div>
  );
}
