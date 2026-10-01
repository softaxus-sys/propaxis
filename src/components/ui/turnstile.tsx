"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile widget. Rendered inside a <form>, it auto-injects its own
 * hidden `cf-turnstile-response` input on submit — no callback/state wiring needed to
 * fit this codebase's plain `<form action={serverAction}>` pattern; the server action
 * just reads `formData.get("cf-turnstile-response")` and calls verifyTurnstile()
 * (src/lib/turnstile.ts). Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set,
 * matching verifyTurnstile's own no-op-when-unconfigured behavior.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}
