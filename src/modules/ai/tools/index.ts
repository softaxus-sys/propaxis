import type { AiTool } from "./types";
import { searchPropertiesTool } from "./search-properties";
import { getPropertyPassportTool } from "./get-property-passport";
import { compareAreasTool } from "./compare-areas";
import { estimateValuationTool } from "./estimate-valuation";

export const AI_TOOLS: AiTool<never, unknown>[] = [
  searchPropertiesTool,
  getPropertyPassportTool,
  compareAreasTool,
  estimateValuationTool,
] as unknown as AiTool<never, unknown>[];

export function getToolByName(name: string) {
  return AI_TOOLS.find((t) => t.name === name);
}
