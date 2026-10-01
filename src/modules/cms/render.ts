/**
 * CmsPage.body is stored as Markdown and rendered to sanitized HTML at request time
 * (never pre-rendered/cached as HTML in the DB) — so a sanitizer fix or a markdown
 * rendering change applies to all existing content immediately, not just new saves.
 * Authors are ADMIN-only today (see docs/cms-specification.md §F), but content still
 * goes through a sanitizer before reaching the page — defense in depth, not "trusted
 * input," since that's the correct default for anything rendered as HTML.
 *
 * Using `sanitize-html`, not `isomorphic-dompurify` — the latter pulls in jsdom (it
 * needs a DOM to run DOMPurify's real browser implementation against in Node), and
 * jsdom's own dependency chain broke in production on Vercel with an ESM/CJS interop
 * error (`html-encoding-sniffer` requiring an ESM-only package) that didn't reproduce
 * locally at all — a dynamic route only actually executes at request time, so `next
 * build` passing never caught it. `sanitize-html` does pure string-level sanitization
 * with no DOM/jsdom dependency, which is both lighter and removes that entire class of
 * bundler/runtime incompatibility for a purely server-side use case like this one.
 */
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: false });

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "strong", "em", "blockquote",
  "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "img", "figure",
  "figcaption", "hr", "br",
];
const ALLOWED_ATTRS = ["href", "src", "alt", "title", "target", "rel"];

export function renderCmsBody(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTRS },
  });
}

/** Plain-text excerpt for search snippets/OG fallbacks when no explicit excerpt is set. */
export function plainTextExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/[#*_`>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
