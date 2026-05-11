import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "default" | "light";
  tagline?: boolean;
  /** Tailwind height class for the wordmark image, e.g. "h-7" (default) or "h-9" */
  size?: string;
};

export function Logo({
  className,
  variant = "default",
  tagline = true,
  size = "h-7",
}: Props) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src="/tadhealth-logo.png"
        alt="TadHealth"
        className={cn(
          size,
          "w-auto select-none",
          variant === "light" && "brightness-0 invert",
        )}
        draggable={false}
      />
      {tagline && (
        <span
          className={cn(
            "hidden h-6 items-center border-l pl-3 text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline-flex",
            variant === "light"
              ? "border-white/20 text-highlight-200"
              : "border-brand-100 text-brand-500",
          )}
        >
          Employee Portal
        </span>
      )}
    </span>
  );
}
