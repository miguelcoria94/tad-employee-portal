import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createTrainingCourseSchema,
  createTrainingLessonSchema,
  createQuizQuestionSchema,
  submitQuizAnswerSchema,
  submitQuizAttemptSchema,
  assignTrainingSchema,
} from "@tadhealth/shared";
import {
  listPublishedCourses,
  getCourse,
  enrollInCourse,
  listMyEnrollments,
  submitQuizAnswer,
  submitQuizAttempt,
  getMyProgress,
  completeCourse,
  listAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  listEnrollments,
  assignCourse,
} from "../services/training.js";

const idParam = z.object({ id: z.string().uuid() });
const enrollmentIdParam = z.object({ enrollmentId: z.string().uuid() });

const updateCourseBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  isPublished: z.boolean().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

const updateLessonBody = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50_000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateQuestionBody = z.object({
  prompt: z.string().min(1).max(2000).optional(),
  options: z.array(z.string().min(1).max(500)).min(2).max(10).optional(),
  correctIndex: z.number().int().min(0).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function stripCorrectIndex<T extends { correctIndex?: unknown }>(
  q: T,
): Omit<T, "correctIndex"> {
  const { correctIndex: _, ...rest } = q;
  return rest;
}

export const trainingRoutes: FastifyPluginAsync = async (app) => {
  // ─── Employee routes ─────────────────────────────────────────────────────

  app.get(
    "/training",
    { preHandler: [app.requireAuth] },
    async () => {
      const courses = await listPublishedCourses();
      return { courses };
    },
  );

  app.get(
    "/training/enrollments",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const enrollments = await listMyEnrollments(req.user!.sub);
      return { enrollments };
    },
  );

  app.get(
    "/training/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const course = await getCourse(id);
      if (!course) throw app.httpErrors.notFound("Course not found");
      const questions = course.questions.map(stripCorrectIndex);
      return { course: { ...course, questions } };
    },
  );

  app.post(
    "/training/:id/enroll",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      try {
        const enrollment = await enrollInCourse(req.user!.sub, id);
        reply.status(201);
        return { enrollment };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.get(
    "/training/:id/progress",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const progress = await getMyProgress(req.user!.sub, id);
      if (!progress) throw app.httpErrors.notFound("Enrollment not found");
      return { progress };
    },
  );

  app.post(
    "/training/enrollments/:enrollmentId/quiz",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { enrollmentId } = enrollmentIdParam.parse(req.params);
      const input = submitQuizAnswerSchema.parse(req.body);
      try {
        const result = await submitQuizAnswer(
          req.user!.sub,
          enrollmentId,
          input,
        );
        return result;
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.post(
    "/training/:id/quiz",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = submitQuizAttemptSchema.parse(req.body);
      try {
        const result = await submitQuizAttempt(req.user!.sub, id, input);
        return result;
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.post(
    "/training/:id/complete",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      try {
        const enrollment = await completeCourse(req.user!.sub, id);
        return { enrollment };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  // ─── Admin routes ────────────────────────────────────────────────────────

  app.get(
    "/admin/training",
    { preHandler: [app.requireAdmin] },
    async () => {
      const courses = await listAllCourses();
      return { courses };
    },
  );

  app.post(
    "/admin/training",
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const input = createTrainingCourseSchema.parse(req.body);
      const course = await createCourse(input, { actorId: req.user!.sub });
      reply.status(201);
      return { course };
    },
  );

  app.patch(
    "/admin/training/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateCourseBody.parse(req.body);
      const course = await updateCourse(id, input);
      if (!course) throw app.httpErrors.notFound("Course not found");
      return { course };
    },
  );

  app.delete(
    "/admin/training/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const course = await deleteCourse(id);
      if (!course) throw app.httpErrors.notFound("Course not found");
      return { id: course.id };
    },
  );

  app.post(
    "/admin/training/:id/lessons",
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id: courseId } = idParam.parse(req.params);
      const raw = createTrainingLessonSchema.parse(req.body);
      const lesson = await createLesson(courseId, raw);
      reply.status(201);
      return { lesson };
    },
  );

  app.patch(
    "/admin/training/lessons/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateLessonBody.parse(req.body);
      const lesson = await updateLesson(id, input);
      if (!lesson) throw app.httpErrors.notFound("Lesson not found");
      return { lesson };
    },
  );

  app.delete(
    "/admin/training/lessons/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const lesson = await deleteLesson(id);
      if (!lesson) throw app.httpErrors.notFound("Lesson not found");
      return { id: lesson.id };
    },
  );

  app.post(
    "/admin/training/lessons/:id/questions",
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id: lessonId } = idParam.parse(req.params);
      const raw = createQuizQuestionSchema.parse(req.body);
      const question = await createQuizQuestion(lessonId, raw);
      reply.status(201);
      return { question };
    },
  );

  app.patch(
    "/admin/training/questions/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateQuestionBody.parse(req.body);
      const question = await updateQuizQuestion(id, input);
      if (!question) throw app.httpErrors.notFound("Question not found");
      return { question };
    },
  );

  app.delete(
    "/admin/training/questions/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const question = await deleteQuizQuestion(id);
      if (!question) throw app.httpErrors.notFound("Question not found");
      return { id: question.id };
    },
  );

  app.get(
    "/admin/training/:id/enrollments",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const enrollments = await listEnrollments(id);
      return { enrollments };
    },
  );

  app.post(
    "/admin/training/:id/assign",
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const input = assignTrainingSchema.parse(req.body);
      try {
        const result = await assignCourse(req.user!.sub, id, input);
        reply.status(201);
        return result;
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );
};
