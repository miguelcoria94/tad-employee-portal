import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, EyeOff } from "lucide-react";
import type { SurveyRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type SurveyListItem = SurveyRow & {
  hasResponded: boolean;
  responseCount: number;
};

export function SurveysPage() {
  const { data, isLoading } = useQuery<{ surveys: SurveyListItem[] }>({
    queryKey: ["surveys"],
    queryFn: () => api("/api/v1/surveys"),
  });

  const surveys = data?.surveys ?? [];

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
            Surveys
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Share your perspective — your input shapes how the team works.
          </p>
        </header>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : surveys.length === 0 ? (
            <EmptyState
              title="No surveys yet"
              description="Once an admin publishes one, it'll show up here."
            />
          ) : (
            <ul className="space-y-3">
              {surveys.map((s) => (
                <li
                  key={s.id}
                  className="group relative rounded-2xl border border-brand-100 bg-white p-6 shadow-soft transition-colors hover:border-highlight-300"
                >
                  <Link
                    to={`/surveys/${s.id}`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={`Open ${s.title}`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight text-brand-900">
                        {s.title}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {s.isAnonymous && (
                          <Badge variant="neutral">
                            <EyeOff className="h-3 w-3" /> Anonymous
                          </Badge>
                        )}
                        {s.hasResponded && (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3" /> Responded
                          </Badge>
                        )}
                        {s.closesAt && (
                          <span className="text-xs text-brand-500">
                            Closes{" "}
                            {new Date(s.closesAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-brand-300 transition-colors group-hover:text-brand-900" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
