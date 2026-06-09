import { z } from "zod";

export const trainingCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  isPublished: z.boolean(),
  passingScore: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TrainingCourseRow = z.infer<typeof trainingCourseSchema>;

export const createTrainingCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  isPublished: z.boolean().default(false),
  passingScore: z.number().int().min(0).max(100).default(70),
});
export type CreateTrainingCourseInput = z.infer<
  typeof createTrainingCourseSchema
>;

export const trainingLessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});
export type TrainingLessonRow = z.infer<typeof trainingLessonSchema>;

export const createTrainingLessonSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().max(50_000).default(""),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateTrainingLessonInput = z.infer<
  typeof createTrainingLessonSchema
>;

export const quizQuestionSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  prompt: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number().int(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});
export type QuizQuestionRow = z.infer<typeof quizQuestionSchema>;

export const createQuizQuestionSchema = z.object({
  lessonId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10),
  correctIndex: z.number().int().min(0),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;

export const TRAINING_ENROLLMENT_STATUSES = [
  "assigned",
  "in_progress",
  "passed",
  "failed",
] as const;
export const trainingEnrollmentStatusSchema = z.enum(
  TRAINING_ENROLLMENT_STATUSES,
);
export type TrainingEnrollmentStatus = z.infer<
  typeof trainingEnrollmentStatusSchema
>;

export const trainingEnrollmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  employeeId: z.string().uuid(),
  status: trainingEnrollmentStatusSchema,
  assignedByUserId: z.string().uuid().nullable(),
  assignedAt: z.string().nullable(),
  dueAt: z.string().nullable(),
  attemptCount: z.number().int(),
  bestScore: z.number().int().nullable(),
  passedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type TrainingEnrollmentRow = z.infer<typeof trainingEnrollmentSchema>;

// Legacy per-question answer submission (kept for backward compatibility).
export const submitQuizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().min(0),
});
export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>;

// Whole-quiz attempt: the employee submits every answer at once and we grade
// the attempt, mark pass/fail, and (on pass) complete the course.
export const submitQuizAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedIndex: z.number().int().min(0),
      }),
    )
    .min(1),
});
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;

export const trainingAttemptAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int(),
  isCorrect: z.boolean(),
});
export type TrainingAttemptAnswerRow = z.infer<
  typeof trainingAttemptAnswerSchema
>;

export const trainingQuizAttemptSchema = z.object({
  id: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  courseId: z.string().uuid(),
  attemptNumber: z.number().int(),
  score: z.number().int(),
  totalQuestions: z.number().int(),
  correctCount: z.number().int(),
  passed: z.boolean(),
  answers: z.array(trainingAttemptAnswerSchema),
  createdAt: z.string(),
});
export type TrainingQuizAttemptRow = z.infer<typeof trainingQuizAttemptSchema>;

export const quizAttemptResultSchema = z.object({
  attempt: trainingQuizAttemptSchema,
  enrollment: trainingEnrollmentSchema,
  // Per-question grading so the UI can show which answers were right/wrong.
  results: z.array(trainingAttemptAnswerSchema),
});
export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;

// Admin/manager assigns ("email requests") a course to one or more employees.
export const assignTrainingSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1).max(500),
  dueAt: z.string().datetime().nullable().optional(),
  message: z.string().max(2000).optional(),
});
export type AssignTrainingInput = z.infer<typeof assignTrainingSchema>;
