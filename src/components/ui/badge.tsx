import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-sand-100 text-sand-700 border border-sand-200",
        accent: "bg-bronze-100 text-bronze-600 border border-bronze-200",
        success: "bg-[#e8f4ee] text-success border border-[#c6e4d5]",
        info: "bg-[#e9eff8] text-info border border-[#cddaee]",
        dark: "bg-ink-950 text-white",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Marks a value/section that is not sourced from a real or licensed feed. See docs/ARCHITECTURE.md §6. */
export function DemoDataBadge({ className }: { className?: string }) {
  return <span className={cn("demo-data-badge", className)}>Demo data</span>;
}
