import { z } from "zod";
import type { AiTool } from "./types";
import { getPropertyPassport } from "@/modules/properties/passport";

const inputSchema = z.object({ listingId: z.string().min(1) });

export const getPropertyPassportTool: AiTool<z.infer<typeof inputSchema>> = {
  name: "get_property_passport",
  description:
    "Get the full Property Passport for a specific listing: asking price, transaction/rental history, " +
    "comparables and area market metrics. Use this to answer 'is this property reasonably priced?' or " +
    "any question about a specific listing the user has already found (by its listing id/URL).",
  jsonSchema: {
    type: "object",
    properties: { listingId: { type: "string", description: "The listing's id, from a prior search_properties result." } },
    required: ["listingId"],
  },
  inputSchema,
  execute: async ({ listingId }) => {
    const passport = await getPropertyPassport(listingId);
    if (!passport) return { found: false };

    const { listing, comparables, marketMetric } = passport;
    return {
      found: true,
      title: listing.title,
      type: listing.type,
      askingPriceAed: listing.askingPriceAed,
      askingRentAedYear: listing.askingRentAedYear,
      area: listing.property.area.name,
      lastTransactionAed: listing.property.transactions[0]?.priceAed ?? null,
      lastRentalAed: listing.property.rentalTransactions[0]?.annualRentAed ?? null,
      areaAvgPricePerSqftAed: marketMetric?.avgPricePerSqftAed ?? null,
      areaGrossRentalYieldPct: marketMetric?.grossRentalYieldPct ?? null,
      verificationStatus: listing.property.verification?.status ?? "UNVERIFIED",
      comparableCount: comparables.length,
      comparables: comparables.map((c) => ({
        title: c.title,
        askingPriceAed: c.askingPriceAed,
        askingRentAedYear: c.askingRentAedYear,
      })),
      isDemoData: listing.isDemoData,
    };
  },
};
