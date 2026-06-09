import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, FileText } from "lucide-react";
import type { DepartmentResourceRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

function ResourceCard({ r }: { r: DepartmentResourceRow }) {
  const hasContent = !!(r.content && r.content.trim());
  const inner = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-highlight-100 text-highlight-700">
        {hasContent ? (
          <FileText className="h-5 w-5" />
        ) : (
          <ExternalLink className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-brand-900">
          {r.title}
        </span>
        <span className="block truncate text-xs text-brand-500">
          {hasContent ? "Read document" : `Open ${r.linkLabel}`}
        </span>
      </span>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-soft transition-colors hover:border-highlight-300 hover:bg-highlight-50/40";

  if (hasContent) {
    return (
      <Link to={`/resources/${r.id}`} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={r.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {inner}
    </a>
  );
}

export function ResourcesPage() {
  const { data, isLoading } = useQuery<{ resources: DepartmentResourceRow[] }>({
    queryKey: ["company-resources"],
    queryFn: () => api("/api/v1/company-resources"),
  });

  const resources = data?.resources ?? [];

  // Group by category (treat null/"" as "General").
  const grouped = new Map<string, DepartmentResourceRow[]>();
  for (const r of resources) {
    const key = r.category && r.category.trim() ? r.category : "General";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const groupNames = [...grouped.keys()].sort();

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-highlight-100 text-highlight-700 shadow-soft">
            <BookOpen className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
              For everyone
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 md:text-4xl">
              Resources &amp; Handbook
            </h1>
          </div>
        </header>
        <p className="mt-4 max-w-3xl text-lg text-brand-600">
          The company handbook, benefits, and policies — everything available to
          every employee. Ask Tad if you can't find what you need.
        </p>

        {isLoading ? (
          <div className="grid place-items-center py-24">
            <Spinner />
          </div>
        ) : resources.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No resources yet"
              description="Company resources will appear here once an admin adds them."
            />
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {groupNames.map((g) => (
              <section key={g}>
                <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-brand-500">
                  {g}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {grouped.get(g)!.map((r) => (
                    <ResourceCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
