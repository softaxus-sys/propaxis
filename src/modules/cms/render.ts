/**
 * CmsPage.body is stored as Markdown and rendered to sanitized HTML at request time
 * (never pre-rendered/cached as HTML in the DB) — so a sanitizer fix or a markdown
 * rendering change applies to all existing content immediately, not just new saves.
 * Authors are ADMIN-only today (see docs/cms-specification.md §F), but content still
 * goes through DOMPurify before reaching the page — defense in depth, not "trusted
 * input," since that's the correct default for anything rendered as HTML.
 */
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({ gfm: true, breaks: false });

export function renderCmsBody(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "strong", "em", "blockquote",
      "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "img", "figure",
      "figcaption", "hr", "br",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
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
