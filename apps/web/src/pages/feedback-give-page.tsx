import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { FeedbackQuestion } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type PendingFeedback = {
  id: string;
  requestType: "self" | "about_other";
  questions: FeedbackQuestion[];
  subjectEmployee: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    title: string | null;
  };
  requesterName: string;
  isAnonymous: boolean;
  createdAt: string;
};

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function FeedbackGivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ feedbackRequest: PendingFeedback | undefined }>({
    queryKey: ["feedback", "pending"],
    queryFn: () => api(`/api/v1/feedback/pending`),
    select: (d) => {
      const list = (d as unknown as { feedbackRequests: PendingFeedback[] })
        .feedbackRequests;
      return { feedbackRequest: list?.find((r) => r.id === id) };
    },
  });

  const request = data?.feedbackRequest;

  const submit = useMutation({
    mutationFn: () =>
      api(`/api/v1/feedback/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({
          answers: (request?.questions ?? [])
            .map((q) => ({
              questionId: q.id,
              label: q.label,
              answerHtml: answers[q.id] ?? "",
            }))
            .filter((a) => !isEmptyHtml(a.answerHtml)),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      navigate("/feedback");
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : (err as Error).message),
  });

  const decline = useMutation({
    mutationFn: () => api(`/api/v1/feedback/${id}/decline`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      navigate("/feedback");
    },
  });

  function handleSubmit() {
    setError(null);
    const answered = (request?.questions ?? []).filter(
      (q) => !isEmptyHtml(answers[q.id] ?? ""),
    );
    if (answered.length === 0) {
      setError("Please answer at least one question.");
      return;
    }
    submit.mutate();
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-brand-mesh">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            to="/feedback"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feedback
          </Link>
          <p className="mt-8 text-sm text-brand-600">
            Feedback request not found.
          </p>
        </div>
      </div>
    );
  }

  const subjectName = `${request.subjectEmployee.firstName} ${request.subjectEmployee.lastName ?? ""}`.trim();

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/feedback"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            TadHealth
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            Give Feedback
          </h1>
        </header>

        <Card className="mt-8">
          <CardBody>
            <div className="flex items-center gap-4">
              <Avatar
                initials={`${request.subjectEmployee.firstName.charAt(0)}${(request.subjectEmployee.lastName ?? "").charAt(0) || ""}`.toUpperCase()}
                src={request.subjectEmployee.avatarUrl}
                size="lg"
              />
              <div>
                <p className="text-base font-semibold text-brand-900">
                  {subjectName}
                </p>
                {request.subjectEmployee.title && (
                  <p className="text-sm text-brand-500">
                    {request.subjectEmployee.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-brand-500">
                  Requested by {request.requesterName} ·{" "}
                  {new Date(request.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {request.isAnonymous && (
              <div className="mt-4 rounded-lg border border-highlight-200 bg-highlight-50 px-3 py-2 text-sm text-highlight-800">
                Your identity will not be shared with {subjectName}.
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mt-6 space-y-5">
          {request.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardBody className="space-y-3">
                <span className="text-sm font-medium text-brand-900">
                  {idx + 1}. {q.label}
                </span>
                <RichTextEditor
                  value={answers[q.id] ?? ""}
                  onChange={(html) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: html }))
                  }
                  placeholder="Type your response…"
                  minHeight="min-h-[120px]"
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

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to decline this feedback request?",
                )
              ) {
                decline.mutate();
              }
            }}
            disabled={decline.isPending}
            className="text-sm font-medium text-brand-500 hover:text-red-600"
          >
            Decline request
          </button>
          <Button onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? (
              <Spinner className="border-white/40 border-t-white" />
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
