import type { VroduxProvider } from "./provider";
import { MockVroduxProvider } from "./mock-provider";

/**
 * Resolves the active VRODUX provider. Falls back to the mock provider whenever
 * VRODUX_API_URL isn't configured (local dev, or before the real integration ships) —
 * see docs/ARCHITECTURE.md §7. Swap in a real HTTP-backed VroduxProvider here once
 * the VRODUX API contract is available; nothing else in the codebase needs to change.
 */
export function getVroduxProvider(): VroduxProvider {
  if (!process.env.VRODUX_API_URL) {
    return new MockVroduxProvider();
  }

  // TODO: return a real HTTP-backed VroduxProvider once the VRODUX API is available.
  return new MockVroduxProvider();
}
