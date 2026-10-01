import type { Metadata } from "next";

// Covers /developer/dashboard/** — distinct from the public /developers/[slug] profile
// pages (plural route), which stay indexable.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DeveloperSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
