import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import type {
  TrainingCourseRow,
  TrainingLessonRow,
  QuizQuestionRow,
  TrainingEnrollmentRow,
  TrainingQuizAttemptRow,
  QuizAttemptResult,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { cn } from "@/lib/utils";

type QuestionPublic = Omit<QuizQuestionRow, "correctIndex">;

type CourseDetail = TrainingCourseRow & {
  lessons: TrainingLessonRow[];
  questions: QuestionPublic[];
};

type ProgressData = {
  enrollment: TrainingEnrollmentRow;
  attempts: TrainingQuizAttemptRow[];
  totalQuestions: number;
  passingScore: number;
  bestScore: number | null;
};

type ActiveView = { kind: "lesson"; index: number } | { kind: "quiz" };

export function TrainingCoursePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [active, setActive] = useState<ActiveView>({ kind: "lesson", index: 0 });
  // Local selections for the current quiz attempt: questionId → option index.
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [lastResult, setLastResult] = useState<QuizAttemptResult | null>(null);

  const courseQ = useQuery<{ course: CourseDetail }>({
    queryKey: ["training-course", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/training/${id}`),
  });

  const progressQ = useQuery<ProgressData>({
    queryKey: ["training-progress", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/training/${id}/progress`),
    retry: false,
  });

  const enroll = useMutation({
    mutationFn: () => api(`/api/v1/training/${id}/enroll`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-progress", id] });
      qc.invalidateQueries({ queryKey: ["training-enrollments"] });
    },
  });

  const submitQuiz = useMutation({
    mutationFn: (answers: { questionId: string; selectedIndex: number }[]) =>
      api<QuizAttemptResult>(`/api/v1/training/${id}/quiz`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    onSuccess: (result) => {
      setLastResult(result);
      qc.invalidateQueries({ queryKey: ["training-progress", id] });
      qc.invalidateQueries({ queryKey: ["training-enrollments"] });
    },
  });

  const markComplete = useMutation({
    mutationFn: () =>
      api(`/api/v1/training/${id}/complete`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-progress", id] });
      qc.invalidateQueries({ queryKey: ["training-enrollments"] });
    },
  });

  const course = courseQ.data?.course;
  const lessons = useMemo(() => course?.lessons ?? [], [course]);
  const questions = useMemo(() => course?.questions ?? [], [course]);
  const enrollment = progressQ.data?.enrollment;
  const passingScore = progressQ.data?.passingScore ?? course?.passingScore ?? 70;
  const attempts = progressQ.data?.attempts ?? [];
  const hasQuiz = questions.length > 0;
  const status = enrollment?.status;
  const isPassed = status === "passed";

  if (courseQ.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        This course isn't available.{" "}
        <Link to="/training" className="font-semibold text-brand-900">
          Back to Training
        </Link>
      </div>
    );
  }

  // The most relevant result to show: a just-submitted attempt, else the latest
  // stored attempt's per-question grading.
  const latestAttempt = attempts[0] ?? null;
  const resultToShow: QuizAttemptResult | null =
    lastResult ??
    (latestAttempt
      ? {
          attempt: latestAttempt,
          enrollment: enrollment!,
          results: latestAttempt.answers,
        }
      : null);
  const gradeByQuestion = new Map(
    (resultToShow?.results ?? []).map((r) => [r.questionId, r]),
  );

  const allAnswered = questions.every((q) => selections[q.id] !== undefined);
  const submitError = submitQuiz.error as Error | undefined;
  const submitErrorMsg =
    submitError instanceof ApiError ? submitError.message : submitError?.message;

  function startRetry() {
    setSelections({});
    setLastResult(null);
    submitQuiz.reset();
  }

  function doSubmit() {
    const answers = questions
      .filter((q) => selections[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, selectedIndex: selections[q.id]! }));
    submitQuiz.mutate(answers);
  }

  const activeLesson =
    active.kind === "lesson" ? lessons[active.index] : undefined;

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          to="/training"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Training
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Course
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900 md:text-4xl">
            {course.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isPassed && (
              <Badge variant="success">
                <Trophy className="h-3 w-3" />
                Completed
              </Badge>
            )}
            {status === "failed" && (
              <Badge
                variant="neutral"
                className="bg-red-50 text-red-700 ring-red-200"
              >
                Not passed yet
              </Badge>
            )}
            {hasQuiz && (
              <Badge variant="highlight">Pass ≥ {passingScore}%</Badge>
            )}
            {enrollment?.dueAt && !isPassed && (
              <Badge variant="neutral">
                Due {new Date(enrollment.dueAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </header>

        {!enrollment && (
          <div className="mt-8">
            <Card>
              <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
                <GraduationCap className="h-10 w-10 text-highlight-400" />
                <div>
                  <p className="text-lg font-semibold text-brand-900">
                    Enroll to start learning
                  </p>
                  <p className="mt-1 text-sm text-brand-600">
                    {lessons.length}{" "}
                    {lessons.length === 1 ? "lesson" : "lessons"}
                    {hasQuiz &&
                      ` · ${questions.length} quiz ${questions.length === 1 ? "question" : "questions"}`}
                  </p>
                </div>
                <Button
                  onClick={() => enroll.mutate()}
                  disabled={enroll.isPending}
                >
                  {enroll.isPending && (
                    <Spinner className="border-white/40 border-t-white" />
                  )}
                  Enroll Now
                </Button>
              </CardBody>
            </Card>
          </div>
        )}

        {enrollment && lessons.length === 0 && !hasQuiz && (
          <div className="mt-8">
            <Card>
              <CardBody className="py-10 text-center">
                <p className="text-sm text-brand-500">
                  No lessons have been added to this course yet.
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {enrollment && (lessons.length > 0 || hasQuiz) && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav className="flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white p-2 shadow-soft">
                {lessons.map((lesson, idx) => {
                  const isActive =
                    active.kind === "lesson" && active.index === idx;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActive({ kind: "lesson", index: idx })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-900 text-white"
                          : "text-brand-700 hover:bg-brand-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-brand-100 text-brand-600",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="min-w-0 truncate">{lesson.title}</span>
                    </button>
                  );
                })}

                {hasQuiz && (
                  <button
                    onClick={() => setActive({ kind: "quiz" })}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      active.kind === "quiz"
                        ? "bg-brand-900 text-white"
                        : "text-brand-700 hover:bg-brand-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                        active.kind === "quiz"
                          ? "bg-white/20 text-white"
                          : isPassed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-highlight-100 text-highlight-700",
                      )}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ListChecks className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 truncate">Quiz</span>
                  </button>
                )}
              </nav>

              {/* Status / progress card */}
              <div className="mt-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
                {hasQuiz ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-400">
                      Your progress
                    </p>
                    <p className="mt-2 text-sm text-brand-700">
                      {enrollment.attemptCount > 0
                        ? `${enrollment.attemptCount} attempt${enrollment.attemptCount === 1 ? "" : "s"}`
                        : "Not attempted yet"}
                    </p>
                    {typeof enrollment.bestScore === "number" && (
                      <p className="text-sm font-semibold text-brand-900">
                        Best score: {enrollment.bestScore}%
                      </p>
                    )}
                    {!isPassed && (
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => setActive({ kind: "quiz" })}
                      >
                        <ListChecks className="h-4 w-4" />
                        {enrollment.attemptCount > 0
                          ? "Retake quiz"
                          : "Take quiz"}
                      </Button>
                    )}
                  </>
                ) : (
                  !isPassed && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => markComplete.mutate()}
                      disabled={markComplete.isPending}
                    >
                      {markComplete.isPending && (
                        <Spinner className="border-brand-800/40 border-t-brand-800" />
                      )}
                      <Trophy className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  )
                )}
                {isPassed && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Trophy className="h-4 w-4" />
                    Course completed
                  </div>
                )}
              </div>
            </aside>

            {/* Main content */}
            <div className="min-w-0">
              {active.kind === "lesson" && activeLesson && (
                <Card>
                  <CardBody>
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
                      <BookOpen className="h-3.5 w-3.5" />
                      Lesson {active.index + 1}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-brand-900">
                      {activeLesson.title}
                    </h2>

                    {activeLesson.content && (
                      <RichTextRenderer
                        html={activeLesson.content}
                        className="mt-5"
                      />
                    )}

                    <div className="mt-8 flex items-center justify-between border-t border-brand-100 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={active.index === 0}
                        onClick={() =>
                          setActive({ kind: "lesson", index: active.index - 1 })
                        }
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Previous
                      </Button>
                      {active.index < lessons.length - 1 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setActive({
                              kind: "lesson",
                              index: active.index + 1,
                            })
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : hasQuiz ? (
                        <Button
                          size="sm"
                          onClick={() => setActive({ kind: "quiz" })}
                        >
                          Go to quiz
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span />
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {active.kind === "quiz" && (
                <QuizView
                  questions={questions}
                  passingScore={passingScore}
                  selections={selections}
                  onSelect={(qid, idx) =>
                    setSelections((prev) => ({ ...prev, [qid]: idx }))
                  }
                  result={resultToShow}
                  gradeByQuestion={gradeByQuestion}
                  isPassed={isPassed}
                  allAnswered={allAnswered}
                  isSubmitting={submitQuiz.isPending}
                  hasPendingSelections={Object.keys(selections).length > 0}
                  onSubmit={doSubmit}
                  onRetry={startRetry}
                  errorMessage={submitErrorMsg}
                  attempts={attempts}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizView({
  questions,
  passingScore,
  selections,
  onSelect,
  result,
  gradeByQuestion,
  isPassed,
  allAnswered,
  isSubmitting,
  hasPendingSelections,
  onSubmit,
  onRetry,
  errorMessage,
  attempts,
}: {
  questions: QuestionPublic[];
  passingScore: number;
  selections: Record<string, number>;
  onSelect: (questionId: string, index: number) => void;
  result: QuizAttemptResult | null;
  gradeByQuestion: Map<
    string,
    { questionId: string; selectedIndex: number; isCorrect: boolean }
  >;
  isPassed: boolean;
  allAnswered: boolean;
  isSubmitting: boolean;
  hasPendingSelections: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  errorMessage?: string;
  attempts: TrainingQuizAttemptRow[];
}) {
  // Show graded view when we have a result and the user hasn't started a fresh
  // set of selections (retry clears selections).
  const showGraded = !!result && !hasPendingSelections;
  const lastAttempt = result?.attempt;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
          <ListChecks className="h-3.5 w-3.5" />
          Knowledge Check
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-900">
          Course Quiz
        </h2>
        <p className="mt-1 text-sm text-brand-500">
          Answer all {questions.length}{" "}
          {questions.length === 1 ? "question" : "questions"}. You need{" "}
          {passingScore}% to pass.
        </p>

        {/* Result banner */}
        {showGraded && lastAttempt && (
          <div
            className={cn(
              "mt-5 flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
              lastAttempt.passed
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50",
            )}
          >
            <div className="flex items-center gap-3">
              {lastAttempt.passed ? (
                <Trophy className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p
                  className={cn(
                    "text-base font-bold",
                    lastAttempt.passed ? "text-emerald-800" : "text-red-800",
                  )}
                >
                  {lastAttempt.passed
                    ? "Passed!"
                    : "Not quite — try again"}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    lastAttempt.passed ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  You scored {lastAttempt.score}% ({lastAttempt.correctCount}/
                  {lastAttempt.totalQuestions} correct)
                </p>
              </div>
            </div>
            {!lastAttempt.passed && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="h-4 w-4" />
                Retry quiz
              </Button>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="mt-6 space-y-6">
          {questions.map((q, qIdx) => {
            const grade = showGraded ? gradeByQuestion.get(q.id) : undefined;
            const selectedIndex = grade
              ? grade.selectedIndex
              : (selections[q.id] ?? null);

            return (
              <div
                key={q.id}
                className="rounded-xl border border-brand-100 bg-brand-50/40 p-4"
              >
                <p className="text-sm font-semibold text-brand-900">
                  {qIdx + 1}. {q.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((option, oIdx) => {
                    const isSelected = selectedIndex === oIdx;
                    const showCorrect =
                      grade && grade.isCorrect && isSelected;
                    const showWrong =
                      grade && !grade.isCorrect && isSelected;
                    return (
                      <label
                        key={oIdx}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                          grade ? "cursor-default" : "cursor-pointer",
                          isSelected &&
                            !grade &&
                            "border-highlight-300 bg-highlight-50",
                          showCorrect &&
                            "border-emerald-300 bg-emerald-50 text-emerald-800",
                          showWrong && "border-red-300 bg-red-50 text-red-800",
                          !isSelected &&
                            !showCorrect &&
                            !showWrong &&
                            "border-brand-100 bg-white hover:border-brand-200",
                        )}
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id}`}
                          value={oIdx}
                          checked={isSelected}
                          disabled={!!grade}
                          onChange={() => onSelect(q.id, oIdx)}
                          className="accent-highlight-600"
                        />
                        <span className="flex-1">{option}</span>
                        {showCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                        {showWrong && (
                          <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {grade && !grade.isCorrect && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Incorrect — review the lesson material and try again.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Submit / retry controls */}
        {!showGraded && !isPassed && (
          <div className="mt-6 flex items-center justify-between border-t border-brand-100 pt-4">
            <p className="text-xs text-brand-500">
              {allAnswered
                ? "All questions answered."
                : "Answer every question to submit."}
            </p>
            <Button onClick={onSubmit} disabled={!allAnswered || isSubmitting}>
              {isSubmitting && (
                <Spinner className="border-white/40 border-t-white" />
              )}
              Submit quiz
            </Button>
          </div>
        )}

        {showGraded && isPassed && (
          <div className="mt-6 flex items-center gap-2 border-t border-brand-100 pt-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            You've completed this course.
          </div>
        )}

        {/* Attempt history */}
        {attempts.length > 0 && (
          <div className="mt-8 border-t border-brand-100 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-400">
              Attempt history
            </h3>
            <ul className="mt-3 space-y-1.5">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg bg-brand-50/50 px-3 py-2 text-sm"
                >
                  <span className="text-brand-600">
                    Attempt {a.attemptNumber} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-brand-800">
                      {a.score}%
                    </span>
                    {a.passed ? (
                      <Badge variant="success">Passed</Badge>
                    ) : (
                      <Badge
                        variant="neutral"
                        className="bg-red-50 text-red-700 ring-red-200"
                      >
                        Failed
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
