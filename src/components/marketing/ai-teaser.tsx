import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

const EXAMPLE_PROMPTS = [
  "Find me a 2-bedroom apartment in Dubai Marina under AED 2.5M",
  "Which areas have the best rental yields right now?",
  "Compare Dubai Marina and JVC for investment",
  "Is this property reasonably priced?",
];

export function AiTeaser({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-16">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-ink-950 px-6 py-14 text-white sm:px-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bronze-300">
                <Sparkles className="h-3.5 w-3.5" /> PropAxis AI
              </span>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">{dict.home.aiTitle}</h2>
              <p className="mt-4 max-w-md text-sand-200">{dict.home.aiSubtitle}</p>
              <Link href="/ai-search">
                <Button variant="accent" size="lg" className="mt-6">
                  {dict.home.aiButton}
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sand-100"
                >
                  &ldquo;{prompt}&rdquo;
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
