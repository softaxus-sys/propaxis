import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-sand-200 bg-white shadow-[0_1px_2px_rgba(10,15,31,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
