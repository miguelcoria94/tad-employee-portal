import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  CreateSurveyInput,
  QuestionDraft,
  QuestionType,
  SurveyWithQuestions,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type Draft = CreateSurveyInput;

const blankSurvey: Draft = {
  title: "",
  description: "",
  isAnonymous: false,
  showResultsToAll: false,
  isPublished: true,
  opensAt: null,
  closesAt: null,
  questions: [],
};

function emptyQuestion(): QuestionDraft {
  return {
    prompt: "",
    type: "short_text",
    options: null,
    isRequired: false,
    sortOrder: 0,
  };
}

function isoForInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminSurveyEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blankSurvey);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ survey: SurveyWithQuestions }>({
    queryKey: ["survey", id],
    enabled: !isNew && !!id,
    queryFn: () => api(`/api/v1/surveys/${id}`),
  });

  useEffect(() => {
    if (isNew) {
      setDraft(blankSurvey);
      return;
    }
    if (data) {
      setDraft({
        title: data.survey.title,
        description: data.survey.description,
        isAnonymous: data.survey.isAnonymous,
        showResultsToAll: data.survey.showResultsToAll,
        isPublished: data.survey.isPublished,
        opensAt: isoForInput(data.survey.opensAt),
        closesAt: isoForInput(data.survey.closesAt),
        questions: data.survey.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          options: q.options ?? null,
          isRequired: q.isRequired,
          sortOrder: q.sortOrder,
        })),
      });
    }
  }, [isNew, data]);

  const create = useMutation({
    mutationFn: (input: CreateSurveyInput) =>
      api<{ survey: { id: string } }>("/api/v1/admin/surveys", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      navigate(`/admin/surveys/${res.survey.id}`, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    },
  });

  const update = useMutation({
    mutationFn: (input: CreateSurveyInput) =>
      api(`/api/v1/admin/surveys/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      qc.invalidateQueries({ queryKey: ["survey", id] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    },
  });

  function save() {
    setError(null);
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    for (const q of draft.questions) {
      if (!q.prompt.trim()) {
        setError("Every question needs a prompt.");
        return;
      }
      if (
        (q.type === "single_choice" || q.type === "multi_choice") &&
        (!q.options || q.options.length < 2)
      ) {
        setError(`"${q.prompt}" needs at least 2 options.`);
        return;
      }
    }
    const payload: CreateSurveyInput = {
      ...draft,
      opensAt: draft.opensAt
        ? new Date(draft.opensAt).toISOString()
        : null,
      closesAt: draft.closesAt
        ? new Date(draft.closesAt).toISOString()
        : null,
      questions: draft.questions.map((q, i) => ({
        ...q,
        sortOrder: i,
      })),
    };
    if (isNew) create.mutate(payload);
    else update.mutate(payload);
  }

  if (!isNew && isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner />
      </div>
    );
  }

  const responseCount = data?.survey.responseCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/admin/surveys"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All surveys
        </Link>
        {!isNew && (
          <Link
            to={`/surveys/${id}/results`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            <BarChart3 className="h-4 w-4" />
            View results ({responseCount})
          </Link>
        )}
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-base font-semibold text-brand-900">Details</h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brand-700">Title</span>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Quarterly engagement check-in"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brand-700">
              Description
            </span>
            <RichTextEditor
              value={draft.description}
              onChange={(html) => setDraft({ ...draft, description: html })}
              placeholder="Why this survey exists, how the data will be used…"
              minHeight="min-h-[140px]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Opens at (optional)
              </span>
              <Input
                type="datetime-local"
                value={draft.opensAt ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, opensAt: e.target.value || null })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Closes at (optional)
              </span>
              <Input
                type="datetime-local"
                value={draft.closesAt ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, closesAt: e.target.value || null })
                }
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ToggleField
              label="Published"
              hint="Visible to employees"
              checked={draft.isPublished}
              onChange={(v) => setDraft({ ...draft, isPublished: v })}
            />
            <ToggleField
              label="Anonymous"
              hint="Strip responder identity"
              checked={draft.isAnonymous}
              onChange={(v) => setDraft({ ...draft, isAnonymous: v })}
            />
            <ToggleField
              label="Show results to all"
              hint="Otherwise admin-only"
              checked={draft.showResultsToAll}
              onChange={(v) => setDraft({ ...draft, showResultsToAll: v })}
            />
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-brand-900">Questions</h2>
          {responseCount > 0 && (
            <span className="text-xs text-brand-500">
              Locked — responses already collected.
            </span>
          )}
        </div>

        <div className="space-y-3">
          {draft.questions.map((q, idx) => (
            <QuestionEditor
              key={idx}
              question={q}
              disabled={responseCount > 0}
              onChange={(next) =>
                setDraft((d) => {
                  const qs = [...d.questions];
                  qs[idx] = next;
                  return { ...d, questions: qs };
                })
              }
              onRemove={() =>
                setDraft((d) => ({
                  ...d,
                  questions: d.questions.filter((_, i) => i !== idx),
                }))
              }
            />
          ))}
        </div>

        <Button
          variant="outline"
          className="mt-3"
          disabled={responseCount > 0}
          onClick={() =>
            setDraft((d) => ({
              ...d,
              questions: [...d.questions, emptyQuestion()],
            }))
          }
        >
          <Plus className="h-4 w-4" />
          Add question
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Link to="/admin/surveys">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={save} disabled={create.isPending || update.isPending}>
          {(create.isPending || update.isPending) && (
            <Spinner className="border-white/40 border-t-white" />
          )}
          {isNew ? "Create survey" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-highlight-500"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-900">
          {label}
        </span>
        <span className="block text-xs text-brand-500">{hint}</span>
      </span>
    </label>
  );
}

function QuestionEditor({
  question,
  disabled,
  onChange,
  onRemove,
}: {
  question: QuestionDraft;
  disabled: boolean;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
}) {
  const needsOptions =
    question.type === "single_choice" || question.type === "multi_choice";
  const options = question.options ?? [];

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start gap-3">
          <GripVertical className="mt-2 h-4 w-4 text-brand-300" />
          <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_180px]">
            <Input
              disabled={disabled}
              value={question.prompt}
              onChange={(e) => onChange({ ...question, prompt: e.target.value })}
              placeholder="Question prompt"
            />
            <Select
              disabled={disabled}
              value={question.type}
              onChange={(e) => {
                const type = e.target.value as QuestionType;
                const willNeedOptions =
                  type === "single_choice" || type === "multi_choice";
                onChange({
                  ...question,
                  type,
                  options: willNeedOptions
                    ? question.options ?? ["", ""]
                    : null,
                });
              }}
            >
              <option value="short_text">Short text</option>
              <option value="long_text">Long text</option>
              <option value="single_choice">Single choice</option>
              <option value="multi_choice">Multi choice</option>
              <option value="rating">Rating (1–5)</option>
            </Select>
          </div>
          <button
            disabled={disabled}
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {needsOptions && (
          <div className="ml-7 space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  disabled={disabled}
                  value={opt}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    onChange({ ...question, options: next });
                  }}
                />
                <button
                  disabled={disabled || options.length <= 2}
                  onClick={() =>
                    onChange({
                      ...question,
                      options: options.filter((_, idx) => idx !== i),
                    })
                  }
                  className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                  title="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              disabled={disabled}
              onClick={() =>
                onChange({ ...question, options: [...options, ""] })
              }
              className="text-xs font-semibold text-brand-700 hover:text-brand-900"
            >
              + Add option
            </button>
          </div>
        )}

        <div className="ml-7">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-700">
            <input
              type="checkbox"
              disabled={disabled}
              checked={question.isRequired ?? false}
              onChange={(e) =>
                onChange({ ...question, isRequired: e.target.checked })
              }
              className="h-4 w-4 accent-highlight-500"
            />
            Required
          </label>
        </div>
      </CardBody>
    </Card>
  );
}

// Quiet the "Textarea is declared but never used" if the import lingers
void Textarea;
