"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-sand-200 p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={cn("rounded-full px-2 py-1", locale === "en" ? "bg-ink-950 text-white" : "text-ink-800")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("ar")}
        className={cn("rounded-full px-2 py-1", locale === "ar" ? "bg-ink-950 text-white" : "text-ink-800")}
      >
        عربي
      </button>
    </div>
  );
}
