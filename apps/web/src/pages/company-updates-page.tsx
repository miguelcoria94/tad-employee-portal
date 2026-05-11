import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { CompanyUpdate } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CompanyUpdatesPage() {
  const { data, isLoading } = useQuery<{ updates: CompanyUpdate[] }>({
    queryKey: ["company-updates"],
    queryFn: () => api("/api/v1/company-updates"),
  });

  const updates = data?.updates ?? [];

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            TadHealth
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            Company Updates
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Announcements, news, and weekly notes from the team.
          </p>
        </header>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : updates.length === 0 ? (
            <EmptyState
              title="No updates yet"
              description="Once an admin publishes the first company update, it'll show up here."
            />
          ) : (
            <ol className="relative space-y-8 border-l-2 border-brand-100 pl-6">
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[33px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-highlight-400 ring-4 ring-white"
                  />
                  <article className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
                    <time
                      dateTime={u.publishedAt}
                      className="text-xs font-semibold uppercase tracking-wider text-brand-500"
                    >
                      {formatDate(u.publishedAt)}
                    </time>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-900">
                      {u.title}
                    </h2>
                    {u.body && (
                      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-700">
                        {u.body}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
