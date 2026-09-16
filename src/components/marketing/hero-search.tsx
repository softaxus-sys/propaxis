"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "buy", label: "Buy", href: "/buy" },
  { key: "rent", label: "Rent", href: "/rent" },
  { key: "new-projects", label: "New Projects", href: "/new-projects" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const activeTab = TABS.find((t) => t.key === tab)!;
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    router.push(`${activeTab.href}${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="w-full rounded-2xl border border-sand-200 bg-white/95 p-2 shadow-xl shadow-ink-950/5 backdrop-blur">
      <div className="flex gap-1 px-2 pt-2">
        {TABS.map((t) => (
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
          placeholder="Search by area, building or project — e.g. Dubai Marina"
          className="h-12 flex-1"
        />
        <Button type="submit" size="lg" className="sm:w-auto">
          Search
        </Button>
      </form>
    </div>
  );
}
