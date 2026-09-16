import type { ZodType } from "zod";

/**
 * A PropAxis AI tool. Each tool wraps a module's existing query/service layer —
 * the same code paths the marketing UI uses — so the model can only ever return
 * data that's really in the database, never invent it. See docs/ARCHITECTURE.md §5.
 */
export interface AiTool<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  /** Anthropic tool `input_schema` — plain JSON Schema, kept in sync with `inputSchema` by hand. */
  jsonSchema: Record<string, unknown>;
  inputSchema: ZodType<Input>;
  execute: (input: Input) => Promise<Output>;
}
