import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runAiChat } from "@/modules/ai/orchestrator";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
});

export async function POST(req: Request) {
  const session = await auth();
  const rateLimitKey = session?.user?.id ?? req.headers.get("x-forwarded-for") ?? "anonymous";

  const { ok } = rateLimit(rateLimitKey, 20, 60_000);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await runAiChat(parsed.data.messages);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PropAxis AI is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
