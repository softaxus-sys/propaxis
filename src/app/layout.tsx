import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import Script from "next/script";
import { getLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Qasro.com — The Home Of Palaces",
    template: "%s | Qasro.com",
  },
  description:
    "Qasro is the UAE's AI-powered real estate marketplace and intelligence platform — search, understand, compare and connect across Dubai and the UAE.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${inter.variable} ${notoKufiArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
      <Script
        src="https://erp.vrodux.com/api/seo/snippet/f9b8624be5bb71ee6c180c3a145a822a2b142595/tag.js"
        strategy="afterInteractive"
      />
    </html>
  );
}
