import { cn } from "@/lib/utils";

type Props = {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
} as const;

const palettes = [
  "bg-brand-900 text-white",
  "bg-highlight-400 text-brand-950",
  "bg-accent-400 text-brand-950",
  "bg-brand-700 text-white",
  "bg-highlight-600 text-white",
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export function Avatar({ initials, size = "md", className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide ring-1 ring-white",
        sizeClasses[size],
        colorFor(initials),
        className,
      )}
    >
      {initials}
    </span>
  );
}