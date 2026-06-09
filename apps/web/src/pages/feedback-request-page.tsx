import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, GripVertical, Plus, Save, Search, Trash2, X } from "lucide-react";
import {
  DEFAULT_FEEDBACK_QUESTIONS,
  type FeedbackQuestion,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  title: string | null;
  userId: string | null;
};

type Template = {
  id: string;
  name: string;
  questions: FeedbackQuestion[];
  scope: "private" | "shared";
};

function newQuestionId() {
  return crypto.randomUUID().slice(0, 8);
}

function initials(firstName: string, lastName: string | null) {
  return `${firstName.charAt(0)}${(lastName ?? "").charAt(0) || ""}`.toUpperCase();
}

function fullName(emp: Employee) {
  return `${emp.firstName} ${emp.lastName ?? ""}`.trim();
}

export function FeedbackRequestPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { me, isAdmin } = useAuth();

  const canAboutOthers =
    isAdmin || (me?.managedDepartmentIds?.length ?? 0) > 0;
  const myEmployeeId = me?.employee?.id ?? null;

  const [subjectId, setSubjectId] = useState<string | null>(
    canAboutOthers ? null : myEmployeeId,
  );
  const [respondentIds, setRespondentIds] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>(
    DEFAULT_FEEDBACK_QUESTIONS.map((q) => ({ ...q })),
  );
  const [subjectSearch, setSubjectSearch] = useState("");
  const [respondentSearch, setRespondentSearch] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showRespondentDropdown, setShowRespondentDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: employeesData, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees"],
    queryFn: () => api("/api/v1/employees"),
  });
  const employees = employeesData?.employees ?? [];

  const { data: templatesData } = useQuery<{ templates: Template[] }>({
    queryKey: ["feedback", "templates"],
    queryFn: () => api("/api/v1/feedback/templates"),
    enabled: canAboutOthers,
  });
  const templates = templatesData?.templates ?? [];

  // Respondents must have an account to be addressable.
  const respondentPool = useMemo(
    () => employees.filter((e) => e.userId),
    [employees],
  );

  const subjectEmployee = employees.find((e) => e.id === subjectId);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return employees.slice(0, 10);
    const q = subjectSearch.toLowerCase();
    return employees.filter(
      (e) =>
        fullName(e).toLowerCase().includes(q) ||
        (e.title ?? "").toLowerCase().includes(q),
    );
  }, [employees, subjectSearch]);

  const filteredRespondents = useMemo(() => {
    const exclude = new Set([subjectId].filter(Boolean));
    const available = respondentPool.filter((e) => !exclude.has(e.id));
    if (!respondentSearch.trim()) return available.slice(0, 10);
    const q = respondentSearch.toLowerCase();
    return available.filter(
      (e) =>
        fullName(e).toLowerCase().includes(q) ||
        (e.title ?? "").toLowerCase().includes(q),
    );
  }, [respondentPool, respondentSearch, subjectId]);

  const selectedRespondents = employees.filter((e) =>
    respondentIds.includes(e.id),
  );

  const submit = useMutation({
    mutationFn: () =>
      api("/api/v1/feedback/request", {
        method: "POST",
        body: JSON.stringify({
          requestType: subjectId === myEmployeeId ? "self" : "about_other",
          subjectEmployeeId: subjectId,
          respondentEmployeeIds: respondentIds,
          questions,
          isAnonymous,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      navigate("/feedback?tab=Requested");
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : (err as Error).message),
  });

  const saveTemplate = useMutation({
    mutationFn: (vars: { name: string }) =>
      api("/api/v1/feedback/templates", {
        method: "POST",
        body: JSON.stringify({
          name: vars.name,
          questions,
          scope: "private",
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback", "templates"] }),
  });

  function handleSubmit() {
    setError(null);
    if (!subjectId) {
      setError("Please select who you want feedback about.");
      return;
    }
    if (respondentIds.length === 0) {
      setError("Please select at least one respondent.");
      return;
    }
    if (questions.length === 0 || questions.some((q) => !q.label.trim())) {
      setError("Please make sure every question has text.");
      return;
    }
    submit.mutate();
  }

  function handleSaveTemplate() {
    const name = window.prompt("Name this template");
    if (!name?.trim()) return;
    saveTemplate.mutate({ name: name.trim() });
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

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
            Request Feedback
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            {canAboutOthers
              ? "Choose who the feedback is about, customize the questions, and select who should respond."
              : "Ask colleagues to share feedback about you. Choose who should respond below."}
          </p>
        </header>

        <Card className="mt-8">
          <CardBody className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-900">
                Who is the feedback about?
              </label>
              {!canAboutOthers ? (
                <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
                  <Avatar
                    initials={initials(
                      me?.employee?.firstName ?? "Y",
                      me?.employee?.lastName ?? null,
                    )}
                    src={me?.employee?.avatarUrl}
                    size="sm"
                  />
                  <span className="flex-1 text-sm font-medium text-brand-900">
                    {me?.employee?.firstName} {me?.employee?.lastName ?? ""} (you)
                  </span>
                </div>
              ) : subjectEmployee ? (
                <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
                  <Avatar
                    initials={initials(
                      subjectEmployee.firstName,
                      subjectEmployee.lastName,
                    )}
                    src={subjectEmployee.avatarUrl}
                    size="sm"
                  />
                  <span className="flex-1 text-sm font-medium text-brand-900">
                    {fullName(subjectEmployee)}
                    {subjectEmployee.id === myEmployeeId && " (you)"}
                  </span>
                  <button
                    onClick={() => {
                      setSubjectId(null);
                      setSubjectSearch("");
                    }}
                    className="grid h-6 w-6 place-items-center rounded-md text-brand-500 hover:bg-brand-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                    <Input
                      className="pl-9"
                      placeholder="Search employees..."
                      value={subjectSearch}
                      onChange={(e) => {
                        setSubjectSearch(e.target.value);
                        setShowSubjectDropdown(true);
                      }}
                      onFocus={() => setShowSubjectDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSubjectDropdown(false), 200)
                      }
                    />
                  </div>
                  {showSubjectDropdown && filteredSubjects.length > 0 && (
                    <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-brand-100 bg-white py-1 shadow-lg">
                      {filteredSubjects.map((emp) => (
                        <li key={emp.id}>
                          <button
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSubjectId(emp.id);
                              setSubjectSearch("");
                              setShowSubjectDropdown(false);
                            }}
                          >
                            <Avatar
                              initials={initials(emp.firstName, emp.lastName)}
                              src={emp.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-brand-900">
                                {fullName(emp)}
                              </p>
                              {emp.title && (
                                <p className="truncate text-xs text-brand-500">
                                  {emp.title}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Question builder (only for admins/department heads) */}
            {canAboutOthers && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-brand-900">
                    Questions
                  </label>
                  <div className="flex items-center gap-2">
                    {templates.length > 0 && (
                      <select
                        className="rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-xs text-brand-700"
                        defaultValue=""
                        onChange={(e) => {
                          const t = templates.find(
                            (tpl) => tpl.id === e.target.value,
                          );
                          if (t)
                            setQuestions(
                              t.questions.map((q) => ({ ...q })),
                            );
                          e.target.value = "";
                        }}
                      >
                        <option value="" disabled>
                          Load template…
                        </option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                            {t.scope === "shared" ? " (shared)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={saveTemplate.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-100 px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save as template
                    </button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {questions.map((q, idx) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-2 rounded-xl border border-brand-100 bg-white p-2"
                    >
                      <GripVertical className="mt-2 h-4 w-4 shrink-0 text-brand-300" />
                      <textarea
                        rows={2}
                        value={q.label}
                        placeholder={`Question ${idx + 1}`}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx] = { ...q, label: e.target.value };
                          setQuestions(next);
                        }}
                        className="flex-1 resize-none rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-brand-900 focus:border-highlight-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuestions(questions.filter((_, i) => i !== idx))
                        }
                        className="mt-1 grid h-7 w-7 place-items-center rounded-md text-brand-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>

                {questions.length < 10 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions([
                        ...questions,
                        { id: newQuestionId(), label: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add question
                  </button>
                )}
              </div>
            )}

            {/* Respondents */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-900">
                Who should give feedback?
              </label>
              {selectedRespondents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRespondents.map((emp) => (
                    <span
                      key={emp.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      <Avatar
                        initials={initials(emp.firstName, emp.lastName)}
                        src={emp.avatarUrl}
                        size="sm"
                        className="!h-5 !w-5 !text-[8px]"
                      />
                      {fullName(emp)}
                      <button
                        onClick={() =>
                          setRespondentIds(
                            respondentIds.filter((rId) => rId !== emp.id),
                          )
                        }
                        className="ml-0.5 text-brand-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search employees to add..."
                    value={respondentSearch}
                    onChange={(e) => {
                      setRespondentSearch(e.target.value);
                      setShowRespondentDropdown(true);
                    }}
                    onFocus={() => setShowRespondentDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowRespondentDropdown(false), 200)
                    }
                  />
                </div>
                {showRespondentDropdown && filteredRespondents.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-brand-100 bg-white py-1 shadow-lg">
                    {filteredRespondents.map((emp) => {
                      const selected = respondentIds.includes(emp.id);
                      return (
                        <li key={emp.id}>
                          <button
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50",
                              selected && "bg-brand-50",
                            )}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (selected) {
                                setRespondentIds(
                                  respondentIds.filter((rId) => rId !== emp.id),
                                );
                              } else {
                                setRespondentIds([...respondentIds, emp.id]);
                              }
                            }}
                          >
                            <div
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded border",
                                selected
                                  ? "border-brand-900 bg-brand-900 text-white"
                                  : "border-brand-300",
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </div>
                            <Avatar
                              initials={initials(emp.firstName, emp.lastName)}
                              src={emp.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-brand-900">
                                {fullName(emp)}
                              </p>
                              {emp.title && (
                                <p className="truncate text-xs text-brand-500">
                                  {emp.title}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  isAnonymous ? "bg-brand-900" : "bg-brand-200",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
                    isAnonymous ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
              <span className="text-sm text-brand-700">
                Hide respondent identity from the subject?
              </span>
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={submit.isPending}>
                {submit.isPending ? (
                  <Spinner className="border-white/40 border-t-white" />
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
