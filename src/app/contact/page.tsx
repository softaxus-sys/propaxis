import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const dict = await getDictionary();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-16">
        <Container className="max-w-lg">
          <h1 className="text-2xl font-semibold text-ink-950">{dict.staticPages.contactTitle}</h1>
          <p className="mt-2 text-sm text-sand-600">{dict.staticPages.contactSubtitle}</p>
          <div className="mt-6">
            <EnquiryForm heading={dict.common.sendEnquiry} dict={dict} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
