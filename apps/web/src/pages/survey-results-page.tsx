import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, Users } from "lucide-react";
import type { QuestionResult, SurveyResults } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<SurveyResults>({
    queryKey: ["survey-results", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/surveys/${id}/results`),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        Results aren't available.{" "}
        <Link to="/surveys" className="font-semibold text-brand-900">
          Back to surveys
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to={`/surveys/${data.survey.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to survey
        </Link>

        <header className="mt-8 flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Results
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            {data.survey.title}
          </h1>
          <Badge variant="highlight" className="w-fit">
            <Users className="h-3 w-3" /> {data.responseCount} response
            {data.responseCount === 1 ? "" : "s"}
          </Badge>
        </header>

        <div className="mt-10 space-y-5">
          {data.results.map((r, i) => (
            <Card key={r.questionId}>
              <CardBody className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-base font-semibold text-brand-900">
                    {r.prompt}
                  </p>
                </div>
                <ResultBody result={r} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultBody({ result }: { result: QuestionResult }) {
  if (result.type === "short_text" || result.type === "long_text") {
    const answers = result.textAnswers ?? [];
    if (answers.length === 0) {
      return <p className="text-sm text-brand-500">No responses yet.</p>;
    }
    return (
      <ul className="space-y-2">
        {answers.map((a, i) => (
          <li
            key={i}
            className="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-800"
          >
            {a}
          </li>
        ))}
      </ul>
    );
  }

  if (result.type === "rating") {
    const avg = result.ratingAverage;
    const dist = result.ratingDistribution ?? {};
    const max = Math.max(1, ...Object.values(dist));
    return (
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-brand-900">
            {avg === null || avg === undefined ? "—" : avg.toFixed(1)}
          </span>
          <span className="text-xs font-medium text-brand-500">
            avg of {result.totalAnswers}
          </span>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = dist[String(n)] ?? 0;
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="flex w-10 items-center gap-0.5 text-xs font-semibold text-brand-600">
                  {n} <Star className="h-3 w-3 fill-accent-400 text-accent-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50">
                  <div
                    className="h-full bg-accent-400"
                    style={{ width: `${(c / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium text-brand-700">
                  {c}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // choice questions
  const counts = result.choiceCounts ?? {};
  const total = result.totalAnswers || 1;
  const sortedKeys = Object.keys(counts).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0),
  );

  return (
    <div className="space-y-2">
      {sortedKeys.map((key) => {
        const c = counts[key] ?? 0;
        const pct = Math.round((c / total) * 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-brand-800">{key}</span>
              <span className="text-xs font-semibold text-brand-600">
                {c} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full bg-highlight-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
