"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BuyerRegisterForm } from "./buyer-form";
import { AgentRegisterForm } from "./agent-form";
import { AgencyRegisterForm } from "./agency-form";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

type Tab = "buyer" | "agent" | "agency";

export function RegisterTabs({
  initialTab,
  agencies,
  dict,
}: {
  initialTab: Tab;
  agencies: { id: string; name: string }[];
  dict: Dictionary;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: "buyer", label: dict.auth.tabBuyer },
    { key: "agent", label: dict.auth.tabAgent },
    { key: "agency", label: dict.auth.tabAgency },
  ];

  return (
    <div>
      <div className="flex gap-1 rounded-full border border-sand-200 bg-sand-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-ink-950 text-white" : "text-ink-800 hover:bg-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "buyer" && <BuyerRegisterForm />}
        {tab === "agent" && <AgentRegisterForm agencies={agencies} />}
        {tab === "agency" && <AgencyRegisterForm />}
      </div>
    </div>
  );
}
