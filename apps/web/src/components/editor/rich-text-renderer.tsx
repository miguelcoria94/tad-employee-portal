import { cn } from "@/lib/utils";

type Props = {
  html: string;
  className?: string;
};

/**
 * Renders TipTap-generated HTML. Content is admin-authored only, so we trust
 * it; the editor's StarterKit + Image + Link extensions emit a safe subset
 * (no scripts, no event handlers, no iframes).
 */
export function RichTextRenderer({ html, className }: Props) {
  if (!html) return null;
  return (
    <div
      className={cn("rich-content", className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
