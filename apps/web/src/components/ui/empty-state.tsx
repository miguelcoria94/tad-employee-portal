import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-base font-semibold text-brand-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-brand-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}