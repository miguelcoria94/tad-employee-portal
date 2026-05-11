import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, ExternalLink, MapPin } from "lucide-react";
import type { CompanyEvent, CompanyUpdate } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { htmlToExcerpt } from "@/lib/excerpt";

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CompanyUpdatesPage() {
  const updatesQ = useQuery<{ updates: CompanyUpdate[] }>({
    queryKey: ["company-updates"],
    queryFn: () => api("/api/v1/company-updates"),
  });
  const eventsQ = useQuery<{ events: CompanyEvent[] }>({
    queryKey: ["company-events", "upcoming"],
    queryFn: () => api("/api/v1/company-events?upcoming=true"),
  });

  const updates = updatesQ.data?.updates ?? [];
  const events = eventsQ.data?.events ?? [];
  const loading = updatesQ.isLoading || eventsQ.isLoading;

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
            Updates & Events
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            What's new this week, plus what's coming up.
          </p>
        </header>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <section className="mt-12">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Upcoming Events
                </h2>
                {events.length > 0 && (
                  <Badge variant="highlight">{events.length}</Badge>
                )}
              </div>

              {events.length === 0 ? (
                <EmptyState
                  title="No upcoming events"
                  description="Once an admin schedules one, it'll show up here."
                />
              ) : (
                <ul className="space-y-3">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold tracking-tight text-brand-900">
                            {e.title}
                          </h3>
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-highlight-700">
                            <Calendar className="h-4 w-4" />
                            {formatEventDate(e.startsAt)}
                            {e.endsAt && (
                              <> — {formatEventDate(e.endsAt)}</>
                            )}
                          </p>
                          {e.location && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-600">
                              <MapPin className="h-4 w-4 text-brand-400" />
                              {e.location}
                            </p>
                          )}
                          {e.description && (
                            <RichTextRenderer
                              html={e.description}
                              className="mt-3"
                            />
                          )}
                        </div>
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-12">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Recent Updates
              </h2>

              {updates.length === 0 ? (
                <EmptyState
                  title="No updates yet"
                  description="Once an admin publishes the first update, it'll show up here."
                />
              ) : (
                <ol className="relative space-y-8 border-l-2 border-brand-100 pl-6">
                  {updates.map((u) => {
                    const excerpt = htmlToExcerpt(u.body, 220);
                    return (
                      <li key={u.id} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-[33px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-highlight-400 ring-4 ring-white"
                        />
                        <Link
                          to={`/company-updates/${u.id}`}
                          className="group block rounded-2xl border border-brand-100 bg-white p-6 shadow-soft transition-colors hover:border-highlight-300"
                        >
                          <time
                            dateTime={u.publishedAt}
                            className="text-xs font-semibold uppercase tracking-wider text-brand-500"
                          >
                            {formatLongDate(u.publishedAt)}
                          </time>
                          <h3 className="mt-2 text-xl font-bold tracking-tight text-brand-900">
                            {u.title}
                          </h3>
                          {excerpt && (
                            <p className="mt-3 text-sm leading-relaxed text-brand-700">
                              {excerpt}
                            </p>
                          )}
                          <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-900 group-hover:text-highlight-700">
                            Read more
                            <span aria-hidden>→</span>
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
