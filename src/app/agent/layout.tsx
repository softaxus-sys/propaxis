import type { Metadata } from "next";

// Covers /agent/dashboard/** — distinct from the public /agents/[slug] profile pages
// (plural route), which stay indexable.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AgentSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
