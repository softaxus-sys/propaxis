"use client";

import { useActionState } from "react";
import { estimatePropertyValue, type ValuationResult } from "@/modules/properties/valuation-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"];

export function ValuationForm({ areas }: { areas: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ValuationResult | null, FormData>(estimatePropertyValue, null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Area</label>
            <select name="areaId" required className="h-11 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm">
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Property type</label>
            <select name="propertyType" className="h-11 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm">
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Size (sqft)</label>
            <Input type="number" name="areaSqft" min={1} required placeholder="e.g. 1200" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Estimating…" : "Estimate value"}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col justify-center p-6">
        {!state && <p className="text-sm text-sand-600">Fill in the form to get an estimated value range.</p>}
        {state && !state.found && <p className="text-sm text-danger">{state.error}</p>}
        {state?.found && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-sand-600">Estimated value in {state.areaName}</p>
              {state.isDemoData && <DemoDataBadge />}
            </div>
            <p className="mt-2 text-3xl font-semibold text-ink-950">{formatAed(state.estimatedValueAed, { compact: true })}</p>
            <p className="mt-1 text-sm text-sand-600">
              Range: {formatAed(state.estimatedRangeLowAed, { compact: true })} –{" "}
              {formatAed(state.estimatedRangeHighAed, { compact: true })}
            </p>
            <p className="mt-4 text-xs text-sand-500">
              Based on {formatAed(state.pricePerSqftAed)}/sqft area average. This is an automated estimate, not a
              formal valuation.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
