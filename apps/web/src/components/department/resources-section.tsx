import { Link } from "react-router-dom";
import {
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Wrench,
} from "lucide-react";
import type { DepartmentResourceRow } from "@tadhealth/shared";
import { EmptyState } from "@/components/ui/empty-state";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function LinkChip({ label, href }: { label: string; href?: string | null }) {
  const isPdf = label.toLowerCase() === "pdf";
  const Icon = isPdf ? FileText : LinkIcon;
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-brand-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 transition-colors hover:border-highlight-300 hover:bg-highlight-50 hover:text-highlight-700"
    >
      <Icon className="h-3 w-3" />
      {label}
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

export function ToolsSection({ tools }: { tools: DepartmentResourceRow[] }) {
  // Group by category (treat null / "" as "Other")
  const grouped = new Map<string, DepartmentResourceRow[]>();
  for (const t of tools) {
    const key = t.category && t.category.trim() ? t.category : "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }
  const groupNames = [...grouped.keys()].sort();

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-base font-semibold uppercase tracking-wide text-brand-500">
          Department Tools
        </h2>
        <span className="text-xs text-brand-400">Quick links and tools</span>
      </div>

      {tools.length === 0 ? (
        <EmptyState
          title="No tools yet"
          description="Add quick links from the admin panel."
        />
      ) : (
        <div className="space-y-6">
          {groupNames.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">
                {g}
              </p>
              <ul className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
                {grouped.get(g)!.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 border-b border-brand-50 px-5 py-3 last:border-b-0 hover:bg-brand-50/40"
                  >
                    <Wrench className="h-4 w-4 shrink-0 text-brand-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900">
                      {t.title}
                    </span>
                    <LinkChip label={t.linkLabel} href={t.url} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DocumentsSection({
  documents,
}: {
  documents: DepartmentResourceRow[];
}) {
  // Sort: most recent documentDate first; entries with no date go to the bottom.
  const sorted = [...documents].sort((a, b) => {
    if (a.documentDate && b.documentDate)
      return b.documentDate.localeCompare(a.documentDate);
    if (a.documentDate) return -1;
    if (b.documentDate) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-base font-semibold uppercase tracking-wide text-brand-500">
          Key Documents
        </h2>
        <span className="text-xs text-brand-400">
          Important documents and resources
        </span>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Add documents from the admin panel."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
          {sorted.map((d) => {
            const hasContent = !!(d.content && d.content.trim());
            return (
              <li
                key={d.id}
                className="flex items-center gap-3 border-b border-brand-50 px-5 py-3 last:border-b-0 hover:bg-brand-50/40"
              >
                <FileText className="h-4 w-4 shrink-0 text-brand-400" />
                {hasContent ? (
                  <Link
                    to={`/resources/${d.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900 hover:text-highlight-700 hover:underline"
                  >
                    {d.title}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900">
                    {d.title}
                  </span>
                )}
                {d.documentDate && (
                  <span className="hidden text-xs text-brand-500 sm:inline">
                    {formatDate(d.documentDate)}
                  </span>
                )}
                {hasContent ? (
                  <Link
                    to={`/resources/${d.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-brand-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 transition-colors hover:border-highlight-300 hover:bg-highlight-50 hover:text-highlight-700"
                  >
                    <FileText className="h-3 w-3" />
                    Read
                  </Link>
                ) : (
                  <LinkChip label={d.linkLabel} href={d.url} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
