"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createListing, type CreateListingState } from "@/modules/listings/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: CreateListingState = {};

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"];

export function NewListingForm({ areas }: { areas: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createListing, initialState);
  const [type, setType] = useState<"SALE" | "RENT">("SALE");
  const router = useRouter();

  if (state.success) {
    router.push("/agent/dashboard");
  }

  return (
    <Card className="space-y-4 p-6">
      {state.error && <p className="rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Title</label>
          <Input name="title" required placeholder="e.g. 2BR Apartment, Marina Promenade" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Listing type</label>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as "SALE" | "RENT")}
              className="h-11 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm"
            >
              <option value="SALE">For sale</option>
              <option value="RENT">For rent</option>
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
        </div>

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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Bedrooms</label>
            <Input type="number" name="bedrooms" min={0} defaultValue={1} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Bathrooms</label>
            <Input type="number" name="bathrooms" min={0} defaultValue={1} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Area (sqft)</label>
            <Input type="number" name="areaSqft" min={0} />
          </div>
        </div>

        {type === "SALE" ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Asking price (AED)</label>
            <Input type="number" name="askingPriceAed" min={0} required />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-950">Asking annual rent (AED)</label>
            <Input type="number" name="askingRentAedYear" min={0} required />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Publishing…" : "Publish listing"}
        </Button>
      </form>
    </Card>
  );
}
