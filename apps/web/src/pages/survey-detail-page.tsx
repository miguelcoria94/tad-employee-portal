import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, EyeOff, Star } from "lucide-react";
import type {
  SubmitResponseInput,
  SurveyQuestionRow,
  SurveyWithQuestions,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { cn } from "@/lib/utils";

type DraftValue =
  | { kind: "text"; value: string }
  | { kind: "rating"; value: number | null }
  | { kind: "single"; value: string | null }
  | { kind: "multi"; values: string[] };

type DraftMap = Record<string, DraftValue>;

function emptyDraft(q: SurveyQuestionRow): DraftValue {
  switch (q.type) {
    case "short_text":
    case "long_text":
      return { kind: "text", value: "" };
    case "rating":
      return { kind: "rating", value: null };
    case "single_choice":
      return { kind: "single", value: null };
    case "multi_choice":
      return { kind: "multi", values: [] };
  }
}

function isAnswered(d: DraftValue): boolean {
  switch (d.kind) {
    case "text":
      return d.value.trim().length > 0;
    case "rating":
      return d.value !== null;
    case "single":
      return d.value !== null;
    case "multi":
      return d.values.length > 0;
  }
}

function draftToAnswer(
  questionId: string,
  d: DraftValue,
): SubmitResponseInput["answers"][number] | null {
  switch (d.kind) {
    case "text":
      return d.value.trim()
        ? { questionId, textValue: d.value.trim() }
        : null;
    case "rating":
      return d.value !== null
        ? { questionId, ratingValue: d.value }
        : null;
    case "single":
      return d.value !== null
        ? { questionId, textValue: d.value }
        : null;
    case "multi":
      return d.values.length
        ? { questionId, choiceValues: d.values }
        : null;
  }
}

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<DraftMap>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ survey: SurveyWithQuestions }>({
    queryKey: ["survey", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/surveys/${id}`),
  });

  const survey = data?.survey;

  useMemo(() => {
    if (!survey) return;
    setDraft((prev) => {
      const next: DraftMap = { ...prev };
      for (const q of survey.questions) {
        if (!next[q.id]) next[q.id] = emptyDraft(q);
      }
      return next;
    });
  }, [survey?.id, survey?.questions.length]);

  const submit = useMutation({
    mutationFn: (payload: SubmitResponseInput) =>
      api(`/api/v1/surveys/${id}/responses`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      qc.invalidateQueries({ queryKey: ["survey", id] });
      navigate(
        survey?.showResultsToAll ? `/surveys/${id}/results` : "/surveys",
        { state: { submitted: true } },
      );
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    },
  });

  if (isLoading || !survey) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const now = new Date();
  const notOpenYet = survey.opensAt && new Date(survey.opensAt) > now;
  const closed = survey.closesAt && new Date(survey.closesAt) < now;
  const locked =
    notOpenYet ||
    closed ||
    (survey.hasResponded && !survey.isAnonymous) ||
    submit.isPending;

  function handleSubmit() {
    if (!survey) return;
    setError(null);

    for (const q of survey.questions) {
      if (q.isRequired && !isAnswered(draft[q.id] ?? emptyDraft(q))) {
        setError(`Please answer: "${q.prompt}"`);
        return;
      }
    }

    const answers = survey.questions
      .map((q) => draftToAnswer(q.id, draft[q.id] ?? emptyDraft(q)))
      .filter((a): a is NonNullable<typeof a> => a !== null);

    submit.mutate({ answers });
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          to="/surveys"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All surveys
        </Link>

        <header className="mt-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {survey.isAnonymous && (
              <Badge variant="neutral">
                <EyeOff className="h-3 w-3" /> Anonymous
              </Badge>
            )}
            {survey.showResultsToAll && (
              <Badge variant="highlight">
                <BarChart3 className="h-3 w-3" /> Results visible to all
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            {survey.title}
          </h1>
          {survey.description && (
            <RichTextRenderer html={survey.description} />
          )}
        </header>

        {notOpenYet && (
          <NoticeCard variant="info">
            This survey opens{" "}
            {new Date(survey.opensAt!).toLocaleString("en-US")}.
          </NoticeCard>
        )}
        {closed && (
          <NoticeCard variant="neutral">
            This survey closed{" "}
            {new Date(survey.closesAt!).toLocaleString("en-US")}.
          </NoticeCard>
        )}
        {survey.hasResponded && !survey.isAnonymous && (
          <NoticeCard variant="success">
            You've already submitted a response to this survey.
            {survey.showResultsToAll && (
              <>
                {" "}
                <Link
                  to={`/surveys/${survey.id}/results`}
                  className="font-semibold underline"
                >
                  See results →
                </Link>
              </>
            )}
          </NoticeCard>
        )}

        <div className="mt-10 space-y-5">
          {survey.questions.map((q, i) => (
            <Card key={q.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-brand-900">
                      {q.prompt}
                      {q.isRequired && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </p>
                  </div>
                </div>
                <QuestionField
                  question={q}
                  value={draft[q.id] ?? emptyDraft(q)}
                  onChange={(v) =>
                    setDraft((prev) => ({ ...prev, [q.id]: v }))
                  }
                  disabled={!!locked}
                />
              </CardBody>
            </Card>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          {survey.showResultsToAll && (
            <Link
              to={`/surveys/${survey.id}/results`}
              className="text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              See results →
            </Link>
          )}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!!locked || submit.isPending}
          >
            {submit.isPending ? (
              <Spinner className="border-white/40 border-t-white" />
            ) : (
              "Submit response"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoticeCard({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "info" | "neutral" | "success";
}) {
  const styles = {
    info: "border-highlight-200 bg-highlight-50 text-highlight-800",
    neutral: "border-brand-100 bg-brand-50 text-brand-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[variant];
  return (
    <div
      className={cn(
        "mt-6 rounded-xl border px-4 py-3 text-sm font-medium",
        styles,
      )}
    >
      {children}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: SurveyQuestionRow;
  value: DraftValue;
  onChange: (v: DraftValue) => void;
  disabled: boolean;
}) {
  switch (question.type) {
    case "short_text":
      if (value.kind !== "text") return null;
      return (
        <Input
          disabled={disabled}
          value={value.value}
          onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        />
      );
    case "long_text":
      if (value.kind !== "text") return null;
      return (
        <Textarea
          rows={4}
          disabled={disabled}
          value={value.value}
          onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        />
      );
    case "single_choice":
      if (value.kind !== "single") return null;
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                value.value === opt
                  ? "border-highlight-400 bg-highlight-50"
                  : "border-brand-100 hover:bg-brand-50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={question.id}
                checked={value.value === opt}
                disabled={disabled}
                onChange={() => onChange({ kind: "single", value: opt })}
                className="h-4 w-4 accent-highlight-500"
              />
              <span className="font-medium text-brand-800">{opt}</span>
            </label>
          ))}
        </div>
      );
    case "multi_choice":
      if (value.kind !== "multi") return null;
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            const checked = value.values.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                  checked
                    ? "border-highlight-400 bg-highlight-50"
                    : "border-brand-100 hover:bg-brand-50",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...value.values, opt]
                      : value.values.filter((v) => v !== opt);
                    onChange({ kind: "multi", values: next });
                  }}
                  className="h-4 w-4 accent-highlight-500"
                />
                <span className="font-medium text-brand-800">{opt}</span>
              </label>
            );
          })}
        </div>
      );
    case "rating":
      if (value.kind !== "rating") return null;
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ kind: "rating", value: n })}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-lg border transition-colors",
                value.value !== null && value.value >= n
                  ? "border-accent-400 bg-accent-100 text-accent-700"
                  : "border-brand-100 text-brand-400 hover:border-accent-200",
                disabled && "cursor-not-allowed opacity-60",
              )}
              aria-label={`${n} of 5`}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  value.value !== null && value.value >= n && "fill-current",
                )}
              />
            </button>
          ))}
        </div>
      );
  }
}
