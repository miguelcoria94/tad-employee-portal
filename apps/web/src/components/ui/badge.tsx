import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "neutral" | "brand" | "highlight" | "accent" | "success";

const variants: Record<Variant, string> = {
  neutral: "bg-brand-50 text-brand-700 ring-brand-100",
  brand: "bg-brand-900 text-white ring-brand-900",
  highlight: "bg-highlight-100 text-highlight-800 ring-highlight-200",
  accent: "bg-accent-100 text-accent-800 ring-accent-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}