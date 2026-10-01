import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";

// Placeholder legal content — generic, not reviewed by a lawyer. Have this checked
// against UAE PDPL (Federal Decree-Law No. 45 of 2021) requirements specifically
// before relying on it — see the chat where this was added for the caveat.
export const metadata: Metadata = { title: "Privacy Policy" };

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "1. What this covers",
    body: [
      "This policy explains what personal data Qasro.com collects, how we use it, and who we share it with. It applies to buyers, tenants, agents, agencies, developers, and anyone else using the platform.",
    ],
  },
  {
    heading: "2. What we collect",
    body: [
      "Account information: name, email, phone number, and password (stored as a hash, never in plain text), plus role-specific details like a RERA/trade license number for agents and agencies.",
      "Enquiry information: when you contact an agent about a listing, we collect your name, email, phone, and message.",
      "Usage information: pages you visit, searches you run, and properties you save, so we can operate and improve the platform.",
      "AI search queries: questions you ask Qasro AI are sent to our AI provider to generate a response, grounded in our own listing data.",
    ],
  },
  {
    heading: "3. How we use it",
    body: [
      "To operate your account, verify agent/agency registrations, and let you search, save, and enquire about listings.",
      "To route your enquiry to the right agent or agency, and — for agencies that connect their Vrodux CRM tenant — to forward it into their Vrodux tenant so their team can manage it there.",
      "To generate market intelligence (valuations, comparables, trends) from aggregated listing and transaction data.",
    ],
  },
  {
    heading: "4. Who we share it with",
    body: [
      "The agent or agency responsible for a listing you enquire about, so they can respond to you.",
      "Vrodux, but only for an agency that has explicitly connected its own Vrodux tenant, and only for enquiries about that agency's listings — never shared with an agency's Vrodux tenant if they haven't connected one.",
      "Service providers who help us run the platform (hosting, database, and email delivery), under contractual obligations to protect your data.",
      "We don't sell your personal data.",
    ],
  },
  {
    heading: "5. Cookies",
    body: [
      "We use cookies for essential site functions (staying signed in, remembering your language preference) and, where enabled, basic analytics to understand how the platform is used.",
    ],
  },
  {
    heading: "6. Your rights",
    body: [
      "You can ask us to access, correct, or delete the personal data we hold about you by contacting hello@softaxis.ae. We'll respond within a reasonable time and may need to verify your identity first.",
    ],
  },
  {
    heading: "7. Data retention",
    body: [
      "We keep account and enquiry data for as long as your account is active or as needed to provide the service, and may retain some records longer where required by law.",
    ],
  },
  {
    heading: "8. Changes to this policy",
    body: [
      "We may update this policy from time to time; the \"last updated\" date above reflects the most recent version.",
    ],
  },
  {
    heading: "9. Contact",
    body: ["Questions about this policy, or requests about your data, can be sent to hello@softaxis.ae."],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-ink-950">Privacy Policy</h1>
          <p className="mt-2 text-sm text-sand-500">Last updated 30 September 2026</p>

          <div className="mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.heading}>
                <h2 className="font-semibold text-ink-950">{section.heading}</h2>
                {section.body.map((p, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-sand-700">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
