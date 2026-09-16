import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
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

/**
 * PropAxis AI talks to any OpenAI-compatible chat-completions endpoint — Groq by
 * default (generous free tier, fast, solid tool-calling support), but swapping to
 * OpenRouter or any other provider is just an env var change, not a code change.
 * See docs/ARCHITECTURE.md §5.
 */
function getClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "PropAxis AI isn't configured yet — AI_API_KEY is missing from the server environment.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

const MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

export async function runAiChat(messages: ChatMessage[]): Promise<AiChatResult> {
  const client = getClient();

  const tools: ChatCompletionTool[] = AI_TOOLS.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.jsonSchema,
    },
  }));

  const conversation: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m): ChatCompletionMessageParam => ({ role: m.role, content: m.content })),
  ];

  const toolCalls: AiToolCallLog[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: conversation,
      tools,
    });

    const choice = response.choices[0];
    const message = choice.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content?.trim() ?? "", toolCalls };
    }

    conversation.push({
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls,
    });

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;

      const tool = getToolByName(call.function.name);
      let parsedInput: unknown;
      try {
        parsedInput = JSON.parse(call.function.arguments || "{}");
      } catch {
        parsedInput = {};
      }
      toolCalls.push({ name: call.function.name, input: parsedInput });

      if (!tool) {
        conversation.push({ role: "tool", tool_call_id: call.id, content: `Unknown tool: ${call.function.name}` });
        continue;
      }

      try {
        const validated = tool.inputSchema.parse(parsedInput);
        const result = await tool.execute(validated as never);
        conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      } catch (err) {
        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: `Tool error: ${err instanceof Error ? err.message : "unknown error"}`,
        });
      }
    }
  }

  return {
    reply: "I gathered some data but ran out of tool-call budget for this turn — could you narrow your question?",
    toolCalls,
  };
}
