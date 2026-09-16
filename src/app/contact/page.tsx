import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-16">
        <Container className="max-w-lg">
          <h1 className="text-2xl font-semibold text-ink-950">Contact PropAxis</h1>
          <p className="mt-2 text-sm text-sand-600">Have a question? Send us a message and we&apos;ll get back to you.</p>
          <div className="mt-6">
            <EnquiryForm heading="Send a message" />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
