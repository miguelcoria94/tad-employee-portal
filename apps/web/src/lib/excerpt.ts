/**
 * Strip HTML tags from rich-text content and truncate to a short preview.
 * Cheap implementation — fine for trusted, admin-authored HTML.
 */
export function htmlToExcerpt(html: string, maxChars = 180): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    // SSR / non-browser fallback (we don't run SSR but be safe).
    const stripped = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > maxChars
      ? stripped.slice(0, maxChars).trimEnd() + "…"
      : stripped;
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxChars
    ? text.slice(0, maxChars).trimEnd() + "…"
    : text;
}
