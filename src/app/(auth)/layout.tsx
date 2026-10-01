import type { Metadata } from "next";

// Covers /login and /register. Register is a generic tabbed form with no unique
// content per tab (client-side state, same URL) — SEO value for "become an agent" /
// "list your property" intents belongs on the dedicated landing pages
// (/for-professionals, /list-your-property), not this form itself.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
