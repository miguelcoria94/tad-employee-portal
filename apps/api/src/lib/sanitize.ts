import sanitizeHtml from "sanitize-html";

// Allowlist matching what the TipTap editor can emit (StarterKit + Link +
// Image). Anything else (scripts, event handlers, iframes, styles) is stripped
// so user-authored feedback can be rendered with dangerouslySetInnerHTML
// safely.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "strike",
    "u",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/**
 * Strip all HTML tags and collapse whitespace, returning readable plain text.
 * Used to feed admin-authored rich content to the AI assistant without dumping
 * raw markup into the model context.
 */
export function htmlToText(html: string): string {
  if (!html) return "";
  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    // Keep block-level breaks readable as spaces rather than glued words.
    textFilter: (t) => t,
  });
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
