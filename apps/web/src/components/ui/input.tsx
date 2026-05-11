import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-brand-100 bg-white px-4 text-sm text-brand-900 placeholder:text-brand-400 shadow-sm transition-colors",
        "focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200",
        "disabled:cursor-not-allowed disabled:bg-brand-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-900 placeholder:text-brand-400 shadow-sm transition-colors",
      "focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-brand-100 bg-white px-3 text-sm text-brand-900 shadow-sm transition-colors",
      "focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";