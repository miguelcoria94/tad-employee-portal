import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  GraduationCap,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type {
  TrainingCourseRow,
  TrainingLessonRow,
  TrainingEnrollmentRow,
  TrainingEnrollmentStatus,
} from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { htmlToExcerpt } from "@/lib/excerpt";

type CourseWithLessons = TrainingCourseRow & {
  lessons: TrainingLessonRow[];
};

type EnrollmentWithCourse = TrainingEnrollmentRow & {
  courseTitle?: string;
};

const STATUS_META: Record<
  TrainingEnrollmentStatus,
  {
    label: string;
    variant: "success" | "highlight" | "neutral" | "accent";
    className?: string;
  }
> = {
  assigned: { label: "Assigned to you", variant: "highlight" },
  in_progress: { label: "In progress", variant: "neutral" },
  passed: { label: "Passed", variant: "success" },
  failed: {
    label: "Retake needed",
    variant: "neutral",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

export function TrainingPage() {
  const qc = useQueryClient();

  const coursesQ = useQuery<{ courses: CourseWithLessons[] }>({
    queryKey: ["training-courses"],
    queryFn: () => api("/api/v1/training"),
  });

  const enrollmentsQ = useQuery<{ enrollments: EnrollmentWithCourse[] }>({
    queryKey: ["training-enrollments"],
    queryFn: () => api("/api/v1/training/enrollments"),
  });

  const enroll = useMutation({
    mutationFn: (courseId: string) =>
      api(`/api/v1/training/${courseId}/enroll`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-enrollments"] });
    },
  });

  const courses = coursesQ.data?.courses ?? [];
  const enrollments = enrollmentsQ.data?.enrollments ?? [];
  const loading = coursesQ.isLoading;

  function getEnrollment(courseId: string) {
    return enrollments.find((e) => e.courseId === courseId);
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-4xl px-6 py-12">
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
            Training
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Courses and learning materials to help you grow.
          </p>
        </header>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No courses available yet"
              description="New training courses will appear here as they're published."
            />
          </div>
        ) : (
          <section className="mt-10">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Available Courses
              </h2>
              <Badge variant="highlight">{courses.length}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => {
                const enrollment = getEnrollment(course.id);
                const isEnrolled = !!enrollment;
                const status = enrollment?.status;
                const isPassed = status === "passed";
                const isFailed = status === "failed";
                const meta = status ? STATUS_META[status] : null;
                const lessonCount = course.lessons?.length ?? 0;
                const dueAt = enrollment?.dueAt;
                const overdue =
                  !!dueAt && !isPassed && new Date(dueAt) < new Date();

                return (
                  <div
                    key={course.id}
                    className="group flex flex-col rounded-2xl border border-brand-100 bg-white shadow-soft transition-colors hover:border-highlight-300"
                  >
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-highlight-50 text-highlight-700">
                          <GraduationCap className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold tracking-tight text-brand-900 group-hover:text-highlight-700">
                              {course.title}
                            </h3>
                            {meta && (
                              <Badge
                                variant={meta.variant}
                                className={meta.className}
                              >
                                {isPassed && <Trophy className="h-3 w-3" />}
                                {meta.label}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-500">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5" />
                              {lessonCount}{" "}
                              {lessonCount === 1 ? "lesson" : "lessons"}
                            </span>
                            {typeof enrollment?.bestScore === "number" && (
                              <span>Best score {enrollment.bestScore}%</span>
                            )}
                            {dueAt && (
                              <span
                                className={
                                  overdue
                                    ? "flex items-center gap-1 font-semibold text-red-600"
                                    : "flex items-center gap-1"
                                }
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                Due {new Date(dueAt).toLocaleDateString()}
                                {overdue && " (overdue)"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {course.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-brand-700">
                          {htmlToExcerpt(course.description, 140)}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-brand-100 px-5 py-3">
                      {isEnrolled ? (
                        <Link to={`/training/${course.id}`}>
                          <Button
                            size="sm"
                            variant={isFailed ? "outline" : "secondary"}
                            className="w-full"
                          >
                            {isPassed ? (
                              <Trophy className="h-3.5 w-3.5" />
                            ) : isFailed ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            {isPassed
                              ? "Review"
                              : isFailed
                                ? "Retry course"
                                : status === "assigned"
                                  ? "Start course"
                                  : "Continue"}
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={enroll.isPending}
                          onClick={() => enroll.mutate(course.id)}
                        >
                          {enroll.isPending ? (
                            <Spinner className="border-brand-300 border-t-brand-900" />
                          ) : (
                            <GraduationCap className="h-3.5 w-3.5" />
                          )}
                          Enroll
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
