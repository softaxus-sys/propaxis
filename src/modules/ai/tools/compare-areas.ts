import { z } from "zod";
import type { AiTool } from "./types";
import { listAreas } from "@/modules/areas/queries";

const inputSchema = z.object({
  areaNames: z.array(z.string()).min(1).max(5).describe("Area names or slugs to compare, e.g. ['Dubai Marina', 'JVC']"),
});

export const compareAreasTool: AiTool<z.infer<typeof inputSchema>> = {
  name: "compare_areas",
  description:
    "Compare up to 5 areas side by side on price per sqft, average rent and gross rental yield. Use this " +
    "for questions like 'compare Dubai Marina and JVC' or 'which areas have the best rental yields'.",
  jsonSchema: {
    type: "object",
    properties: {
      areaNames: { type: "array", items: { type: "string" }, description: "Area names or slugs, e.g. ['Dubai Marina', 'JVC']" },
    },
    required: ["areaNames"],
  },
  inputSchema,
  execute: async ({ areaNames }) => {
    const areas = await listAreas();
    const needles = areaNames.map((n) => n.toLowerCase().replace(/\s+/g, "-"));
    const matches = areas.filter(
      (a) => needles.includes(a.slug) || areaNames.some((n) => a.name.toLowerCase().includes(n.toLowerCase())),
    );

    return {
      areas: matches.map((a) => ({
        name: a.name,
        listingCount: a.listingCount,
        avgPricePerSqftAed: a.latestMetric?.avgPricePerSqftAed ?? null,
        avgAnnualRentAed: a.latestMetric?.avgAnnualRentAed ?? null,
        grossRentalYieldPct: a.latestMetric?.grossRentalYieldPct ?? null,
        isDemoData: a.latestMetric?.isDemoData ?? false,
      })),
    };
  },
};
