import { cn } from "@/lib/utils";

export function Logo({ className, mark = "light" }: { className?: string; mark?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold",
          mark === "light" ? "bg-bronze-400 text-ink-950" : "bg-ink-950 text-bronze-300",
        )}
        aria-hidden
      >
        P
      </span>
      <span className="text-lg">
        Prop<span className="text-bronze-500">Axis</span>
      </span>
    </span>
  );
}
