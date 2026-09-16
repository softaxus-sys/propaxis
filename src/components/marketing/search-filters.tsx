"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL"];
const BEDROOM_OPTIONS = [0, 1, 2, 3, 4, 5];

export function SearchFilters({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("location", location);
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={handleLocationSubmit} className="flex flex-1 gap-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={dict.search.locationPlaceholder}
          />
          <Button type="submit" variant="outline">
            {dict.search.go}
          </Button>
        </form>

        <select
          className="h-11 rounded-lg border border-sand-300 bg-white px-3 text-sm text-ink-950"
          value={searchParams.get("propertyType") ?? ""}
          onChange={(e) => updateParam("propertyType", e.target.value)}
        >
          <option value="">{dict.search.propertyTypeLabel}</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-lg border border-sand-300 bg-white px-3 text-sm text-ink-950"
          value={searchParams.get("bedrooms") ?? ""}
          onChange={(e) => updateParam("bedrooms", e.target.value)}
        >
          <option value="">{dict.search.bedroomsLabel}</option>
          {BEDROOM_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b === 0 ? dict.search.studio : `${b}+`}
            </option>
          ))}
        </select>

        <Input
          type="number"
          placeholder={dict.search.minPrice}
          className="lg:w-40"
          defaultValue={searchParams.get("minPrice") ?? ""}
          onBlur={(e) => updateParam("minPrice", e.target.value)}
        />
        <Input
          type="number"
          placeholder={dict.search.maxPrice}
          className="lg:w-40"
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onBlur={(e) => updateParam("maxPrice", e.target.value)}
        />
      </div>
    </div>
  );
}
