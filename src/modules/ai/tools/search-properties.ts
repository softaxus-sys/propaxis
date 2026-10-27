import { z } from "zod";
import type { AiTool } from "./types";
import { searchListings, listingSearchSchema } from "@/modules/listings/search";
import { summarizeUnits } from "@/modules/listings/unit-summary";

const inputSchema = listingSearchSchema.partial({ listingType: true, page: true });

export const searchPropertiesTool: AiTool<z.infer<typeof inputSchema>> = {
  name: "search_properties",
  description:
    "Search Qasro's real listing database for properties matching filters. Use this whenever the " +
    "user asks to find, browse or filter properties (e.g. '2 bedroom apartment in Dubai Marina under " +
    "AED 2.5M'). Returns up to 12 real listings with price, specs and area — never invent listings.",
  jsonSchema: {
    type: "object",
    properties: {
      listingType: { type: "string", enum: ["SALE", "RENT"], description: "SALE for buying, RENT for renting. Defaults to SALE." },
      location: { type: "string", description: "Free-text area name to match, e.g. 'Dubai Marina'." },
      areaSlug: { type: "string", description: "Exact area slug if known, e.g. 'dubai-marina'." },
      propertyType: {
        type: "string",
        enum: ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "DUPLEX", "PLOT", "OFFICE", "RETAIL", "WAREHOUSE"],
      },
      bedrooms: { type: "number", description: "Minimum bedrooms." },
      minPrice: { type: "number", description: "Minimum asking price (SALE) or annual rent (RENT), in AED." },
      maxPrice: { type: "number", description: "Maximum asking price (SALE) or annual rent (RENT), in AED." },
    },
  },
  inputSchema,
  execute: async (input) => {
    const listingType = input.listingType ?? "SALE";
    const result = await searchListings({ listingType, ...input });
    return {
      total: result.total,
      listings: result.listings.map((l) => {
        // Building-level listings carry the matching units; summarise them instead of
        // reporting the building's headline price as if it were one unit.
        const units = summarizeUnits(l.units, listingType);
        return {
        id: l.id,
        title: l.title,
        type: l.type,
        area: l.property.area.name,
        bedrooms: l.property.bedrooms,
        bathrooms: l.property.bathrooms,
        areaSqft: l.property.areaSqft,
        askingPriceAed: l.askingPriceAed,
        askingRentAedYear: l.askingRentAedYear,
        isDemoData: l.isDemoData,
        ...(units ? { matchingUnits: units.count, fromAed: units.min, toAed: units.max, bedroomMix: units.mix } : {}),
        url: `/property/${l.id}`,
        };
      }),
    };
  },
};
