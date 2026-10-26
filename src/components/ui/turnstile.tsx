"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TurnstileApi {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string }) => string;
  reset: (widget?: string | HTMLElement) => void;
  remove: (widget: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile widget. Rendered inside a <form>, it auto-injects its own
 * hidden `cf-turnstile-response` input on submit — no callback/state wiring needed to
 * fit this codebase's plain `<form action={serverAction}>` pattern; the server action
 * just reads `formData.get("cf-turnstile-response")` and calls verifyTurnstile()
 * (src/lib/turnstile.ts). Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set,
 * matching verifyTurnstile's own no-op-when-unconfigured behavior.
 *
 * The widget is rendered explicitly rather than via the script's implicit scan: the
 * scan only runs once at script load, so widgets mounted later (e.g. the other tabs on
 * /register) never appeared. Tokens are single-use, so the widget is also reset after
 * every submit — otherwise a retry after a validation error re-sends the spent token.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!siteKey || !el) return;
    let widgetId: string | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

    const mount = () => {
      if (!window.turnstile || widgetId) return !!widgetId;
      widgetId = window.turnstile.render(el, { sitekey: siteKey, theme: "light" });
      return true;
    };
    if (!mount()) {
      timer = setInterval(() => {
        if (mount()) clearInterval(timer);
      }, 200);
    }

    const form = el.closest("form");
    const onSubmit = () => {
      // Defer so the action has already captured the FormData with the current token.
      setTimeout(() => {
        if (widgetId) window.turnstile?.reset(widgetId);
      }, 500);
    };
    form?.addEventListener("submit", onSubmit);

    return () => {
      clearInterval(timer);
      form?.removeEventListener("submit", onSubmit);
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={ref} />
    </>
  );
}
