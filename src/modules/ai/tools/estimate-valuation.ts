import { z } from "zod";
import type { AiTool } from "./types";
import { db } from "@/lib/db";

const inputSchema = z.object({
  areaSlug: z.string().optional().describe("Area slug, e.g. 'dubai-marina'. Use compare_areas or search_properties first if unknown."),
  areaName: z.string().optional().describe("Area name if slug isn't known."),
  areaSqft: z.number().positive().describe("Property size in square feet."),
  propertyType: z
    .enum(["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"])
    .optional(),
});

export const estimateValuationTool: AiTool<z.infer<typeof inputSchema>> = {
  name: "estimate_valuation",
  description:
    "Estimate a value range (AED) for a hypothetical property, based on the area's recorded average " +
    "AED/sqft from real transactions/market metrics — not a hypothetical listing. Use this for " +
    "'what would a 1,200 sqft apartment in JVC be worth' style questions. Always state this is an " +
    "estimate derived from area averages, not a formal valuation.",
  jsonSchema: {
    type: "object",
    properties: {
      areaSlug: { type: "string" },
      areaName: { type: "string" },
      areaSqft: { type: "number" },
      propertyType: {
        type: "string",
        enum: ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"],
      },
    },
    required: ["areaSqft"],
  },
  inputSchema,
  execute: async ({ areaSlug, areaName, areaSqft, propertyType }) => {
    const area = await db.area.findFirst({
      where: areaSlug ? { slug: areaSlug } : { name: { contains: areaName ?? "", mode: "insensitive" } },
    });
    if (!area) return { found: false, reason: "Area not found in PropAxis data." };

    const metric = propertyType
      ? await db.marketMetric.findFirst({ where: { areaId: area.id, propertyType }, orderBy: { periodEnd: "desc" } })
      : null;
    const fallbackMetric =
      metric ?? (await db.marketMetric.findFirst({ where: { areaId: area.id, propertyType: null }, orderBy: { periodEnd: "desc" } }));
    if (!fallbackMetric?.avgPricePerSqftAed) {
      return { found: false, reason: `No market metric recorded yet for ${area.name}.` };
    }

    const pricePerSqft = Number(fallbackMetric.avgPricePerSqftAed);
    const estimate = pricePerSqft * areaSqft;

    return {
      found: true,
      area: area.name,
      pricePerSqftAed: pricePerSqft,
      estimatedValueAed: Math.round(estimate),
      estimatedRangeLowAed: Math.round(estimate * 0.9),
      estimatedRangeHighAed: Math.round(estimate * 1.1),
      methodology: "area-avg-price-per-sqft-v1",
      isDemoData: fallbackMetric.isDemoData,
    };
  },
};
