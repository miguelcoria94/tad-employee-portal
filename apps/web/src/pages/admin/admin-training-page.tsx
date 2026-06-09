import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type {
  TrainingCourseRow,
  TrainingLessonRow,
  QuizQuestionRow,
  CreateTrainingCourseInput,
  CreateTrainingLessonInput,
  CreateQuizQuestionInput,
  TrainingEnrollmentRow,
  TrainingEnrollmentStatus,
  Employee,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { htmlToExcerpt } from "@/lib/excerpt";
import { cn } from "@/lib/utils";

type CourseWithDetails = TrainingCourseRow & {
  lessons: (TrainingLessonRow & { questions: QuizQuestionRow[] })[];
};

type EnrollmentWithEmployee = TrainingEnrollmentRow & {
  employeeFirstName?: string;
  employeeLastName?: string | null;
  employeeTitle?: string;
  employeeEmail?: string;
};

const STATUS_META: Record<
  TrainingEnrollmentStatus,
  {
    label: string;
    variant: "success" | "highlight" | "neutral" | "accent";
    className?: string;
  }
> = {
  assigned: { label: "Assigned", variant: "highlight" },
  in_progress: { label: "In progress", variant: "neutral" },
  passed: { label: "Passed", variant: "success" },
  failed: {
    label: "Failed",
    variant: "neutral",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

type CourseEditing = {
  kind: "create" | "edit";
  id?: string;
  draft: CreateTrainingCourseInput;
};

export function AdminTrainingPage() {
  const qc = useQueryClient();
  const [courseEdit, setCourseEdit] = useState<CourseEditing | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [lessonEdit, setLessonEdit] = useState<{
    courseId: string;
    lessonId?: string;
    title: string;
    content: string;
    sortOrder: number;
  } | null>(null);
  const [questionEdit, setQuestionEdit] = useState<{
    lessonId: string;
    questionId?: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    sortOrder: number;
  } | null>(null);
  const [enrollmentsView, setEnrollmentsView] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<CourseWithDetails | null>(null);

  const { data, isLoading } = useQuery<{ courses: CourseWithDetails[] }>({
    queryKey: ["training", "admin"],
    queryFn: () => api("/api/v1/admin/training"),
  });

  const enrollmentsQ = useQuery<{ enrollments: EnrollmentWithEmployee[] }>({
    queryKey: ["training", "admin", "enrollments", enrollmentsView],
    enabled: !!enrollmentsView,
    queryFn: () =>
      api(`/api/v1/admin/training/${enrollmentsView}/enrollments`),
  });

  const createCourse = useMutation({
    mutationFn: (input: CreateTrainingCourseInput) =>
      api("/api/v1/admin/training", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setCourseEdit(null);
    },
  });

  const updateCourse = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTrainingCourseInput> }) =>
      api(`/api/v1/admin/training/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setCourseEdit(null);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/training/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });

  const createLesson = useMutation({
    mutationFn: (input: Omit<CreateTrainingLessonInput, "courseId"> & { courseId: string }) =>
      api(`/api/v1/admin/training/${input.courseId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          sortOrder: input.sortOrder,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setLessonEdit(null);
    },
  });

  const updateLesson = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; content: string; sortOrder: number }) =>
      api(`/api/v1/admin/training/lessons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setLessonEdit(null);
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/training/lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });

  const createQuestion = useMutation({
    mutationFn: (input: Omit<CreateQuizQuestionInput, "lessonId"> & { lessonId: string }) =>
      api(`/api/v1/admin/training/lessons/${input.lessonId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          prompt: input.prompt,
          options: input.options,
          correctIndex: input.correctIndex,
          sortOrder: input.sortOrder,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setQuestionEdit(null);
    },
  });

  const updateQuestion = useMutation({
    mutationFn: ({ id, ...input }: { id: string; prompt: string; options: string[]; correctIndex: number; sortOrder: number }) =>
      api(`/api/v1/admin/training/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      setQuestionEdit(null);
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/training/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });

  const courseError = (createCourse.error ?? updateCourse.error) as Error | undefined;
  const courseErrorMsg = courseError instanceof ApiError ? courseError.message : courseError?.message;

  const courses = data?.courses ?? [];

  function submitCourse() {
    if (!courseEdit) return;
    if (courseEdit.kind === "create") {
      createCourse.mutate(courseEdit.draft);
    } else if (courseEdit.id) {
      updateCourse.mutate({ id: courseEdit.id, input: courseEdit.draft });
    }
  }

  function submitLesson() {
    if (!lessonEdit) return;
    if (lessonEdit.lessonId) {
      updateLesson.mutate({
        id: lessonEdit.lessonId,
        title: lessonEdit.title,
        content: lessonEdit.content,
        sortOrder: lessonEdit.sortOrder,
      });
    } else {
      createLesson.mutate({
        courseId: lessonEdit.courseId,
        title: lessonEdit.title,
        content: lessonEdit.content,
        sortOrder: lessonEdit.sortOrder,
      });
    }
  }

  function submitQuestion() {
    if (!questionEdit) return;
    if (questionEdit.questionId) {
      updateQuestion.mutate({
        id: questionEdit.questionId,
        prompt: questionEdit.prompt,
        options: questionEdit.options,
        correctIndex: questionEdit.correctIndex,
        sortOrder: questionEdit.sortOrder,
      });
    } else {
      createQuestion.mutate({
        lessonId: questionEdit.lessonId,
        prompt: questionEdit.prompt,
        options: questionEdit.options,
        correctIndex: questionEdit.correctIndex,
        sortOrder: questionEdit.sortOrder,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-brand-600">
            Manage training courses, lessons, and quiz questions.
          </p>
          <Button
            onClick={() =>
              setCourseEdit({
                kind: "create",
                draft: {
                  title: "",
                  description: "",
                  isPublished: false,
                  passingScore: 70,
                },
              })
            }
          >
            <Plus className="h-4 w-4" />
            New course
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-3">
            {courses.length === 0 && (
              <Card>
                <CardBody className="py-8 text-center text-sm text-brand-500">
                  No training courses yet. Create one to get started.
                </CardBody>
              </Card>
            )}
            {courses.map((course) => {
              const isExpanded = expandedCourseId === course.id;
              const lessonCount = course.lessons?.length ?? 0;
              const questionCount =
                course.lessons?.reduce(
                  (sum, l) => sum + (l.questions?.length ?? 0),
                  0,
                ) ?? 0;

              return (
                <Card key={course.id}>
                  {/* Course header row */}
                  <div className="flex items-start gap-3 px-5 py-4">
                    <button
                      onClick={() =>
                        setExpandedCourseId(isExpanded ? null : course.id)
                      }
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-brand-900">
                          {course.title}
                        </p>
                        {course.isPublished ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="neutral">Draft</Badge>
                        )}
                        {course.passingScore > 0 && (
                          <Badge variant="highlight">
                            Pass ≥ {course.passingScore}%
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-brand-500">
                        {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} ·{" "}
                        {questionCount} {questionCount === 1 ? "question" : "questions"}
                      </p>
                      {course.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-brand-500">
                          {htmlToExcerpt(course.description, 120)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setAssignFor(course)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-highlight-700 hover:bg-highlight-50"
                        title="Assign to employees"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Assign
                      </button>
                      <button
                        onClick={() =>
                          setEnrollmentsView(
                            enrollmentsView === course.id ? null : course.id,
                          )
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                        title="View enrollments"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCourseEdit({
                            kind: "edit",
                            id: course.id,
                            draft: {
                              title: course.title,
                              description: course.description,
                              isPublished: course.isPublished,
                              passingScore: course.passingScore,
                            },
                          })
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                        title="Edit course"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${course.title}"?`))
                            deleteCourse.mutate(course.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                        title="Delete course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enrollments panel */}
                  {enrollmentsView === course.id && (
                    <div className="border-t border-brand-100 bg-brand-50/40 px-5 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">
                          Enrollments
                        </h4>
                        <button
                          onClick={() => setEnrollmentsView(null)}
                          className="text-brand-400 hover:text-brand-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {enrollmentsQ.isLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner />
                        </div>
                      ) : (enrollmentsQ.data?.enrollments ?? []).length === 0 ? (
                        <p className="py-3 text-center text-xs text-brand-500">
                          No enrollments yet.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {(enrollmentsQ.data?.enrollments ?? []).map((en) => {
                            const meta =
                              STATUS_META[en.status] ?? STATUS_META.in_progress;
                            const name = en.employeeFirstName
                              ? `${en.employeeFirstName} ${en.employeeLastName ?? ""}`.trim()
                              : (en.employeeEmail ?? en.employeeId);
                            return (
                              <li
                                key={en.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-brand-800">
                                    {name}
                                  </p>
                                  <p className="text-[11px] text-brand-400">
                                    {en.attemptCount > 0
                                      ? `${en.attemptCount} attempt${en.attemptCount === 1 ? "" : "s"}`
                                      : "No attempts"}
                                    {en.bestScore !== null &&
                                      ` · best ${en.bestScore}%`}
                                    {en.dueAt &&
                                      ` · due ${new Date(en.dueAt).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <Badge
                                  variant={meta.variant}
                                  className={meta.className}
                                >
                                  {meta.label}
                                </Badge>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Expanded: Lessons & questions */}
                  {isExpanded && (
                    <div className="border-t border-brand-100">
                      {(course.lessons ?? [])
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            className="border-b border-brand-50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3 bg-brand-50/30 px-5 py-3">
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-highlight-100 text-xs font-bold text-highlight-700">
                                {lIdx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-brand-800">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-brand-500">
                                  {lesson.questions?.length ?? 0} quiz{" "}
                                  {(lesson.questions?.length ?? 0) === 1
                                    ? "question"
                                    : "questions"}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    setQuestionEdit({
                                      lessonId: lesson.id,
                                      prompt: "",
                                      options: ["", ""],
                                      correctIndex: 0,
                                      sortOrder:
                                        (lesson.questions?.length ?? 0),
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-highlight-700 hover:bg-highlight-50"
                                  title="Add question"
                                >
                                  <Plus className="h-3 w-3" />
                                  Question
                                </button>
                                <button
                                  onClick={() =>
                                    setLessonEdit({
                                      courseId: course.id,
                                      lessonId: lesson.id,
                                      title: lesson.title,
                                      content: lesson.content,
                                      sortOrder: lesson.sortOrder,
                                    })
                                  }
                                  className="grid h-7 w-7 place-items-center rounded-lg text-brand-500 hover:bg-brand-100"
                                  title="Edit lesson"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(`Delete lesson "${lesson.title}"?`)
                                    )
                                      deleteLesson.mutate(lesson.id);
                                  }}
                                  className="grid h-7 w-7 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                                  title="Delete lesson"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Questions under lesson */}
                            {(lesson.questions ?? []).length > 0 && (
                              <ul className="divide-y divide-brand-50 bg-white">
                                {(lesson.questions ?? [])
                                  .sort((a, b) => a.sortOrder - b.sortOrder)
                                  .map((q) => (
                                    <li
                                      key={q.id}
                                      className="flex items-start gap-3 px-8 py-2.5"
                                    >
                                      <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-brand-800">
                                          {q.prompt}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-brand-400">
                                          {q.options.length} options · correct: option{" "}
                                          {q.correctIndex + 1}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            setQuestionEdit({
                                              lessonId: q.lessonId,
                                              questionId: q.id,
                                              prompt: q.prompt,
                                              options: [...q.options],
                                              correctIndex: q.correctIndex,
                                              sortOrder: q.sortOrder,
                                            })
                                          }
                                          className="grid h-6 w-6 place-items-center rounded text-brand-400 hover:bg-brand-100 hover:text-brand-700"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm("Delete this question?"))
                                              deleteQuestion.mutate(q.id);
                                          }}
                                          className="grid h-6 w-6 place-items-center rounded text-red-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        ))}

                      <div className="px-5 py-3">
                        <button
                          onClick={() =>
                            setLessonEdit({
                              courseId: course.id,
                              title: "",
                              content: "",
                              sortOrder: course.lessons?.length ?? 0,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-highlight-700 transition-colors hover:bg-highlight-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add lesson
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Course create/edit modal */}
      {courseEdit && (
        <Modal
          title={courseEdit.kind === "create" ? "New course" : "Edit course"}
          onClose={() => setCourseEdit(null)}
        >
          <div className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">Title</span>
              <Input
                value={courseEdit.draft.title}
                onChange={(e) =>
                  setCourseEdit({
                    ...courseEdit,
                    draft: { ...courseEdit.draft, title: e.target.value },
                  })
                }
                placeholder="Course title"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Description
              </span>
              <RichTextEditor
                value={courseEdit.draft.description}
                onChange={(html) =>
                  setCourseEdit({
                    ...courseEdit,
                    draft: { ...courseEdit.draft, description: html },
                  })
                }
                placeholder="Course description…"
                minHeight="min-h-[120px]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-700">
              <input
                type="checkbox"
                checked={courseEdit.draft.isPublished}
                onChange={(e) =>
                  setCourseEdit({
                    ...courseEdit,
                    draft: {
                      ...courseEdit.draft,
                      isPublished: e.target.checked,
                    },
                  })
                }
                className="rounded border-brand-200"
              />
              Published (visible to employees)
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Passing score (%)
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                value={courseEdit.draft.passingScore}
                onChange={(e) =>
                  setCourseEdit({
                    ...courseEdit,
                    draft: {
                      ...courseEdit.draft,
                      passingScore: Math.max(
                        0,
                        Math.min(100, parseInt(e.target.value) || 0),
                      ),
                    },
                  })
                }
              />
              <span className="text-[11px] text-brand-400">
                Minimum quiz score required to pass. Set to 0 for content-only
                courses (no quiz gate).
              </span>
            </label>

            {courseErrorMsg && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {courseErrorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCourseEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitCourse}
                disabled={createCourse.isPending || updateCourse.isPending}
              >
                {(createCourse.isPending || updateCourse.isPending) && (
                  <Spinner className="border-white/40 border-t-white" />
                )}
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lesson create/edit modal */}
      {lessonEdit && (
        <Modal
          title={lessonEdit.lessonId ? "Edit lesson" : "New lesson"}
          onClose={() => setLessonEdit(null)}
        >
          <div className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">Title</span>
              <Input
                value={lessonEdit.title}
                onChange={(e) =>
                  setLessonEdit({ ...lessonEdit, title: e.target.value })
                }
                placeholder="Lesson title"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Content
              </span>
              <RichTextEditor
                value={lessonEdit.content}
                onChange={(html) =>
                  setLessonEdit({ ...lessonEdit, content: html })
                }
                placeholder="Lesson content…"
                minHeight="min-h-[200px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Sort order
              </span>
              <Input
                type="number"
                min={0}
                value={lessonEdit.sortOrder}
                onChange={(e) =>
                  setLessonEdit({
                    ...lessonEdit,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setLessonEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitLesson}
                disabled={createLesson.isPending || updateLesson.isPending}
              >
                {(createLesson.isPending || updateLesson.isPending) && (
                  <Spinner className="border-white/40 border-t-white" />
                )}
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Question create/edit modal */}
      {questionEdit && (
        <Modal
          title={questionEdit.questionId ? "Edit question" : "New question"}
          onClose={() => setQuestionEdit(null)}
        >
          <div className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Question prompt
              </span>
              <Input
                value={questionEdit.prompt}
                onChange={(e) =>
                  setQuestionEdit({ ...questionEdit, prompt: e.target.value })
                }
                placeholder="What is…?"
              />
            </label>

            <div className="space-y-2">
              <span className="text-xs font-medium text-brand-700">
                Options
              </span>
              {questionEdit.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={questionEdit.correctIndex === idx}
                    onChange={() =>
                      setQuestionEdit({ ...questionEdit, correctIndex: idx })
                    }
                    className="accent-highlight-600"
                    title={`Mark option ${idx + 1} as correct`}
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...questionEdit.options];
                      next[idx] = e.target.value;
                      setQuestionEdit({ ...questionEdit, options: next });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1"
                  />
                  {questionEdit.options.length > 2 && (
                    <button
                      onClick={() => {
                        const next = questionEdit.options.filter(
                          (_, i) => i !== idx,
                        );
                        const newCorrect =
                          questionEdit.correctIndex >= next.length
                            ? next.length - 1
                            : questionEdit.correctIndex > idx
                              ? questionEdit.correctIndex - 1
                              : questionEdit.correctIndex;
                        setQuestionEdit({
                          ...questionEdit,
                          options: next,
                          correctIndex: newCorrect,
                        });
                      }}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-brand-400">
                Select the radio button next to the correct answer.
              </p>
              {questionEdit.options.length < 10 && (
                <button
                  onClick={() =>
                    setQuestionEdit({
                      ...questionEdit,
                      options: [...questionEdit.options, ""],
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-highlight-700 hover:text-highlight-900"
                >
                  <Plus className="h-3 w-3" />
                  Add option
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Sort order
              </span>
              <Input
                type="number"
                min={0}
                value={questionEdit.sortOrder}
                onChange={(e) =>
                  setQuestionEdit({
                    ...questionEdit,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setQuestionEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitQuestion}
                disabled={
                  createQuestion.isPending || updateQuestion.isPending
                }
              >
                {(createQuestion.isPending || updateQuestion.isPending) && (
                  <Spinner className="border-white/40 border-t-white" />
                )}
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign course modal */}
      {assignFor && (
        <AssignModal
          course={assignFor}
          onClose={() => setAssignFor(null)}
          onAssigned={() => {
            setAssignFor(null);
            qc.invalidateQueries({ queryKey: ["training"] });
          }}
        />
      )}
    </div>
  );
}

function AssignModal({
  course,
  onClose,
  onAssigned,
}: {
  course: CourseWithDetails;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dueAt, setDueAt] = useState("");
  const [message, setMessage] = useState("");

  const employeesQ = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", "all-active"],
    queryFn: () => api("/api/v1/employees"),
  });

  const assign = useMutation({
    mutationFn: () =>
      api(`/api/v1/admin/training/${course.id}/assign`, {
        method: "POST",
        body: JSON.stringify({
          employeeIds: [...selected],
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          message: message.trim() || undefined,
        }),
      }),
    onSuccess: onAssigned,
  });

  const employees = employeesQ.data?.employees ?? [];
  const term = search.trim().toLowerCase();
  const filtered = term
    ? employees.filter((e) =>
        `${e.firstName} ${e.lastName ?? ""} ${e.email} ${e.title}`
          .toLowerCase()
          .includes(term),
      )
    : employees;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const assignError = assign.error as Error | undefined;
  const assignErrorMsg =
    assignError instanceof ApiError ? assignError.message : assignError?.message;

  return (
    <Modal title={`Assign "${course.title}"`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-brand-600">
          Selected employees get an in-app notification and an email asking them
          to take this course.
        </p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-brand-100">
          {employeesQ.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-500">
              No employees found.
            </p>
          ) : (
            <ul className="divide-y divide-brand-50">
              {filtered.map((emp) => {
                const isSel = selected.has(emp.id);
                return (
                  <li key={emp.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-brand-50/50">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(emp.id)}
                        className="accent-highlight-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-brand-800">
                          {emp.firstName} {emp.lastName ?? ""}
                        </span>
                        <span className="block truncate text-[11px] text-brand-400">
                          {emp.title} · {emp.email}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brand-700">
              Due date (optional)
            </span>
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-medium text-brand-700">
              Selected
            </span>
            <span className="inline-flex h-9 items-center rounded-lg bg-brand-50 px-3 text-sm font-semibold text-brand-700">
              {selected.size} employee{selected.size === 1 ? "" : "s"}
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-brand-700">
            Message (optional)
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a short note to include in the assignment email…"
            rows={2}
            className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-highlight-400"
          />
        </label>

        {assignErrorMsg && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {assignErrorMsg}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => assign.mutate()}
            disabled={selected.size === 0 || assign.isPending}
          >
            {assign.isPending && (
              <Spinner className="border-white/40 border-t-white" />
            )}
            <Send className="h-4 w-4" />
            Assign {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-900">{title}</h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}
