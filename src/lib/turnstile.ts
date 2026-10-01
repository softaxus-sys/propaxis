/**
 * Server-side verification for Cloudflare Turnstile (src/components/ui/turnstile.tsx
 * renders the widget). Not configured → verification is skipped (returns true) rather
 * than blocking every form submission in dev/before keys exist; get free keys at
 * https://dash.cloudflare.com/?to=/:account/turnstile.
 */
export async function verifyTurnstile(token: FormDataEntryValue | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification request failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
