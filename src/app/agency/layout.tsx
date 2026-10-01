import type { Metadata } from "next";

// Covers /agency/dashboard/** — distinct from the public /agencies/[slug] profile pages
// (plural route), which stay indexable.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AgencySectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
