import Anthropic from "@anthropic-ai/sdk";
import { AI_TOOLS, getToolByName } from "./tools";

const SYSTEM_PROMPT = `You are PropAxis AI, the real estate intelligence assistant for PropAxis.ae — a UAE property marketplace.

Rules you must follow:
- You only know about properties, areas and market data through your tools. NEVER invent a listing, price, address or statistic. If a tool returns no results, say so plainly.
- When you cite a price, area, or metric, it must come from a tool result you just received.
- Prefer calling search_properties for "find me..." queries, compare_areas for area comparisons, get_property_passport when the user references a specific listing, and estimate_valuation for "what's this worth" questions about a size/area combination.
- Keep answers concise and concrete: mention specific listings/areas/numbers from tool results, not generic real-estate advice.
- If asked something outside UAE real estate, politely redirect to what PropAxis can help with.
- Currency is always AED. Never state a price without the AED prefix.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiToolCallLog = { name: string; input: unknown };

export type AiChatResult = {
  reply: string;
  toolCalls: AiToolCallLog[];
};

const MAX_TOOL_ROUNDS = 4;

export async function runAiChat(messages: ChatMessage[]): Promise<AiChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "PropAxis AI isn't configured yet — ANTHROPIC_API_KEY is missing from the server environment.",
    );
  }

  const client = new Anthropic({ apiKey });

  const anthropicTools = AI_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.jsonSchema as Anthropic.Tool["input_schema"],
  }));

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const toolCalls: AiToolCallLog[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: anthropicTools,
      messages: conversation,
    });

    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    if (response.stop_reason !== "tool_use" || toolUseBlocks.length === 0) {
      return { reply: textBlocks.map((b) => b.text).join("\n").trim(), toolCalls };
    }

    conversation.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const tool = getToolByName(block.name);
      toolCalls.push({ name: block.name, input: block.input });

      if (!tool) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Unknown tool: ${block.name}`,
          is_error: true,
        });
        continue;
      }

      try {
        const parsed = tool.inputSchema.parse(block.input);
        const result = await tool.execute(parsed as never);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Tool error: ${err instanceof Error ? err.message : "unknown error"}`,
          is_error: true,
        });
      }
    }

    conversation.push({ role: "user", content: toolResults });
  }

  return {
    reply: "I gathered some data but ran out of tool-call budget for this turn — could you narrow your question?",
    toolCalls,
  };
}
