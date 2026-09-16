"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Find me a 2-bedroom apartment in Dubai Marina under AED 2.5M",
  "Which areas have the best rental yields right now?",
  "Compare Dubai Marina and JVC for investment",
  "What would a 1,200 sqft apartment in JVC be worth?",
];

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    if (!text.trim() || pending) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessages([...next, { role: "assistant", content: data.reply || "I don't have an answer for that yet." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div>
            <div className="flex items-center gap-2 text-bronze-600">
              <Sparkles className="h-5 w-5" />
              <p className="font-semibold">Ask PropAxis AI</p>
            </div>
            <p className="mt-2 text-sm text-sand-600">
              I search PropAxis&apos;s real listing and market data through structured tools — I never invent
              property information.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-left text-sm text-ink-800 hover:border-bronze-300 hover:bg-bronze-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-ink-950 text-white" : "bg-sand-100 text-ink-950",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-sand-100 px-4 py-2.5 text-sm text-sand-500">Thinking…</div>
          </div>
        )}

        {error && <p className="rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-sand-200 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a property, area or the market…"
          className="h-11 flex-1 rounded-lg border border-sand-300 bg-white px-3.5 text-sm text-ink-950 placeholder:text-sand-500 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10"
        />
        <Button type="submit" disabled={pending} size="md">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
