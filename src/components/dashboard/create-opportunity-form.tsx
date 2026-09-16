"use client";

import { useState } from "react";
import { createOpportunity } from "@/modules/opportunities/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateOpportunityForm({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Add to pipeline
      </Button>
    );
  }

  return (
    <form action={createOpportunity} className="flex items-center gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Input type="number" name="estValueAed" min={0} placeholder="Est. value (AED)" className="h-8 w-40 text-xs" />
      <Button type="submit" size="sm">
        Confirm
      </Button>
    </form>
  );
}
