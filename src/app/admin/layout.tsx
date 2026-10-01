import type { Metadata } from "next";

// Covers every /admin/dashboard/** route — inherited by all nested pages, so a new
// admin page never needs its own noindex to stay out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
