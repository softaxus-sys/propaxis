"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BuyerRegisterForm } from "./buyer-form";
import { AgentRegisterForm } from "./agent-form";
import { AgencyRegisterForm } from "./agency-form";

type Tab = "buyer" | "agent" | "agency";

const TABS: { key: Tab; label: string }[] = [
  { key: "buyer", label: "Buyer / Tenant" },
  { key: "agent", label: "Agent" },
  { key: "agency", label: "Agency" },
];

export function RegisterTabs({
  initialTab,
  agencies,
}: {
  initialTab: Tab;
  agencies: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="flex gap-1 rounded-full border border-sand-200 bg-sand-50 p-1">
        {TABS.map((t) => (
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
