"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { createDeal, updateDealStatus } from "@/modules/deals/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";

type Deal = {
  id: string;
  status: "OPEN" | "WON" | "LOST";
  finalValueAed: Prisma.Decimal | number | string | null;
} | null;

export function DealPanel({ opportunityId, deal }: { opportunityId: string; deal: Deal }) {
  const [creating, setCreating] = useState(false);

  if (!deal) {
    if (!creating) {
      return (
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setCreating(true)}>
          Create deal
        </Button>
      );
    }
    return (
      <form action={createDeal} className="mt-2 space-y-2">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <Input type="number" name="finalValueAed" min={0} placeholder="Final value (AED)" className="h-8 text-xs" />
        <Button type="submit" size="sm" className="w-full">
          Confirm deal
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-sand-200 bg-sand-50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-950">Deal</span>
        <Badge variant={deal.status === "WON" ? "success" : deal.status === "LOST" ? "neutral" : "info"}>
          {deal.status}
        </Badge>
      </div>
      {deal.finalValueAed && (
        <p className="text-xs text-sand-600">{formatAed(Number(deal.finalValueAed), { compact: true })}</p>
      )}
      {deal.status === "OPEN" && (
        <div className="flex gap-1.5">
          <form
            action={(fd) => {
              void updateDealStatus(fd);
            }}
          >
            <input type="hidden" name="dealId" value={deal.id} />
            <input type="hidden" name="status" value="WON" />
            <Button type="submit" size="sm" variant="outline">
              Mark won
            </Button>
          </form>
          <form
            action={(fd) => {
              void updateDealStatus(fd);
            }}
          >
            <input type="hidden" name="dealId" value={deal.id} />
            <input type="hidden" name="status" value="LOST" />
            <Button type="submit" size="sm" variant="ghost">
              Mark lost
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
