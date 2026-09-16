"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

export function HeroSearch({ dict }: { dict: Dictionary }) {
  const router = useRouter();

  const tabs = [
    { key: "buy", label: dict.home.tabBuy, href: "/buy" },
    { key: "rent", label: dict.home.tabRent, href: "/rent" },
    { key: "new-projects", label: dict.home.tabNewProjects, href: "/new-projects" },
  ] as const;

  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("buy");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const activeTab = tabs.find((t) => t.key === tab)!;
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    router.push(`${activeTab.href}${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="w-full rounded-2xl border border-sand-200 bg-white/95 p-2 shadow-xl shadow-ink-950/5 backdrop-blur">
      <div className="flex gap-1 px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-ink-950 text-white" : "text-ink-800 hover:bg-sand-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2 sm:flex-row">
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={dict.home.searchPlaceholder}
          className="h-12 flex-1"
        />
        <Button type="submit" size="lg" className="sm:w-auto">
          {dict.home.searchButton}
        </Button>
      </form>
    </div>
  );
}
