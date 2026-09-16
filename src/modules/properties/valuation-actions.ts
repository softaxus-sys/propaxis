"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const inputSchema = z.object({
  areaId: z.string().min(1),
  areaSqft: z.coerce.number().positive(),
  propertyType: z.enum([
    "APARTMENT",
    "VILLA",
    "TOWNHOUSE",
    "PENTHOUSE",
    "DUPLEX",
    "PLOT",
    "OFFICE",
    "RETAIL",
    "WAREHOUSE",
  ]),
});

export type ValuationResult =
  | { found: false; error: string }
  | {
      found: true;
      areaName: string;
      pricePerSqftAed: number;
      estimatedValueAed: number;
      estimatedRangeLowAed: number;
      estimatedRangeHighAed: number;
      isDemoData: boolean;
    };

export async function estimatePropertyValue(_prev: ValuationResult | null, formData: FormData): Promise<ValuationResult> {
  const parsed = inputSchema.safeParse({
    areaId: formData.get("areaId"),
    areaSqft: formData.get("areaSqft"),
    propertyType: formData.get("propertyType"),
  });
  if (!parsed.success) {
    return { found: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const area = await db.area.findUnique({ where: { id: parsed.data.areaId } });
  if (!area) return { found: false, error: "Area not found." };

  const metric = await db.marketMetric.findFirst({
    where: { areaId: area.id, propertyType: parsed.data.propertyType },
    orderBy: { periodEnd: "desc" },
  });
  const fallbackMetric =
    metric ?? (await db.marketMetric.findFirst({ where: { areaId: area.id }, orderBy: { periodEnd: "desc" } }));

  if (!fallbackMetric?.avgPricePerSqftAed) {
    return { found: false, error: `No market data recorded yet for ${area.name}.` };
  }

  const pricePerSqft = Number(fallbackMetric.avgPricePerSqftAed);
  const estimate = pricePerSqft * parsed.data.areaSqft;

  return {
    found: true,
    areaName: area.name,
    pricePerSqftAed: pricePerSqft,
    estimatedValueAed: Math.round(estimate),
    estimatedRangeLowAed: Math.round(estimate * 0.9),
    estimatedRangeHighAed: Math.round(estimate * 1.1),
    isDemoData: fallbackMetric.isDemoData,
  };
}
