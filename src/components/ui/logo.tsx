import Image from "next/image";
import { cn } from "@/lib/utils";

// `mark` describes the surface the logo sits on: "light" = light background (navy artwork),
// "dark" = dark background (white artwork variant).
export function Logo({ className, mark = "light" }: { className?: string; mark?: "light" | "dark" }) {
  return (
    <Image
      src={mark === "light" ? "/qasro-logo.png" : "/qasro-logo-light.png"}
      alt="Qasro — The Home Of Palaces"
      width={2048}
      height={659}
      priority
      className={cn("h-12 w-auto", className)}
    />
  );
}
