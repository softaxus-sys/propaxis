"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "qasro_cookie_consent"; // "granted" | "denied"
const GA_MEASUREMENT_ID = "G-L35Y75D23K";

/**
 * Gates Google Analytics behind an actual choice, not just a banner that hides while
 * gtag.js loads in the background regardless — the GA <Script> tags below only render
 * once consent === "granted", so nothing is requested from Google until then. Choice
 * persists in localStorage; wrapped in try/catch since a private window or blocked
 * site data can throw on access (see artifact localStorage guidance — same risk here).
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | "unset">("unset");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Inaccessible storage — treat as unset; the banner just won't persist choice.
    }
    setConsent(stored === "granted" || stored === "denied" ? stored : "unset");
    setHydrated(true);
  }, []);

  function choose(value: "granted" | "denied") {
    setConsent(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Choice still applies for this page view even if it can't be remembered.
    }
  }

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      {hydrated && consent === "unset" && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(10,15,31,0.08)] sm:px-6"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sand-700">
              We use cookies for essential site functions and, with your consent, basic analytics to understand how
              Qasro is used.{" "}
              <Link href="/privacy" className="font-medium text-ink-950 underline underline-offset-4">
                Privacy Policy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => choose("denied")}>
                Decline
              </Button>
              <Button size="sm" onClick={() => choose("granted")}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
