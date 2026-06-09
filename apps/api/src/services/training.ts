import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  AssignTrainingInput,
  CreateTrainingCourseInput,
  CreateTrainingLessonInput,
  CreateQuizQuestionInput,
  SubmitQuizAnswerInput,
  SubmitQuizAttemptInput,
  TrainingAttemptAnswerRow,
} from "@tadhealth/shared";
import { notify } from "./notifications.js";
import { sendEmail, renderEmail } from "../lib/email.js";
import { config } from "../config.js";

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ employeeId: schema.profiles.employeeId })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return row?.employeeId ?? null;
}

async function getEmployeeContact(employeeId: string): Promise<{
  email: string;
  name: string;
} | null> {
  const db = getDb();
  const [emp] = await db
    .select({
      email: schema.employees.email,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  if (!emp) return null;
  const name = emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.firstName;
  return { email: emp.email, name };
}

async function getUserContact(userId: string): Promise<{
  email: string;
  name: string;
} | null> {
  const db = getDb();
  const [row] = await db
    .select({
      email: schema.employees.email,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.profiles)
    .innerJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  if (!row) return null;
  const name = row.lastName ? `${row.firstName} ${row.lastName}` : row.firstName;
  return { email: row.email, name };
}

function courseUrl(courseId: string): string {
  return `${config.APP_BASE_URL.replace(/\/$/, "")}/training/${courseId}`;
}

// ─── Employee functions ──────────────────────────────────────────────────────

export async function listPublishedCourses() {
  const db = getDb();
  return db
    .select()
    .from(schema.trainingCourses)
    .where(eq(schema.trainingCourses.isPublished, true))
    .orderBy(desc(schema.trainingCourses.createdAt));
}

async function getCourseQuestions(courseId: string) {
  const db = getDb();
  const lessons = await db
    .select({ id: schema.trainingLessons.id })
    .from(schema.trainingLessons)
    .where(eq(schema.trainingLessons.courseId, courseId));
  const lessonIds = lessons.map((l) => l.id);
  if (lessonIds.length === 0) return [];
  return db
    .select()
    .from(schema.trainingQuizQuestions)
    .where(inArray(schema.trainingQuizQuestions.lessonId, lessonIds))
    .orderBy(schema.trainingQuizQuestions.sortOrder);
}

export async function getCourse(id: string) {
  const db = getDb();
  const [course] = await db
    .select()
    .from(schema.trainingCourses)
    .where(eq(schema.trainingCourses.id, id))
    .limit(1);
  if (!course) return null;

  const lessons = await db
    .select()
    .from(schema.trainingLessons)
    .where(eq(schema.trainingLessons.courseId, id))
    .orderBy(schema.trainingLessons.sortOrder);

  const questions = await getCourseQuestions(id);

  return { ...course, lessons, questions };
}

async function findEnrollment(courseId: string, employeeId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.trainingEnrollments)
    .where(
      and(
        eq(schema.trainingEnrollments.courseId, courseId),
        eq(schema.trainingEnrollments.employeeId, employeeId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function enrollInCourse(userId: string, courseId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const existing = await findEnrollment(courseId, employeeId);
  if (existing) return existing;

  const [course] = await db
    .select({ id: schema.trainingCourses.id })
    .from(schema.trainingCourses)
    .where(
      and(
        eq(schema.trainingCourses.id, courseId),
        eq(schema.trainingCourses.isPublished, true),
      ),
    )
    .limit(1);
  if (!course) {
    throw httpError("Course not found or not published", 404);
  }

  const [enrollment] = await db
    .insert(schema.trainingEnrollments)
    .values({ courseId, employeeId, status: "in_progress" })
    .returning();
  if (!enrollment) throw new Error("Failed to create enrollment");
  return enrollment;
}

export async function listMyEnrollments(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];

  return db
    .select({
      id: schema.trainingEnrollments.id,
      courseId: schema.trainingEnrollments.courseId,
      employeeId: schema.trainingEnrollments.employeeId,
      status: schema.trainingEnrollments.status,
      assignedByUserId: schema.trainingEnrollments.assignedByUserId,
      assignedAt: schema.trainingEnrollments.assignedAt,
      dueAt: schema.trainingEnrollments.dueAt,
      attemptCount: schema.trainingEnrollments.attemptCount,
      bestScore: schema.trainingEnrollments.bestScore,
      passedAt: schema.trainingEnrollments.passedAt,
      completedAt: schema.trainingEnrollments.completedAt,
      createdAt: schema.trainingEnrollments.createdAt,
      courseTitle: schema.trainingCourses.title,
      courseDescription: schema.trainingCourses.description,
      passingScore: schema.trainingCourses.passingScore,
    })
    .from(schema.trainingEnrollments)
    .innerJoin(
      schema.trainingCourses,
      eq(schema.trainingEnrollments.courseId, schema.trainingCourses.id),
    )
    .where(eq(schema.trainingEnrollments.employeeId, employeeId))
    .orderBy(desc(schema.trainingEnrollments.createdAt));
}

/**
 * Legacy per-question answer submission. Retained so older clients keep
 * working; the primary flow is now `submitQuizAttempt`.
 */
export async function submitQuizAnswer(
  userId: string,
  enrollmentId: string,
  input: SubmitQuizAnswerInput,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const [enrollment] = await db
    .select()
    .from(schema.trainingEnrollments)
    .where(
      and(
        eq(schema.trainingEnrollments.id, enrollmentId),
        eq(schema.trainingEnrollments.employeeId, employeeId),
      ),
    )
    .limit(1);
  if (!enrollment) {
    throw httpError("Enrollment not found", 404);
  }

  const [question] = await db
    .select()
    .from(schema.trainingQuizQuestions)
    .where(eq(schema.trainingQuizQuestions.id, input.questionId))
    .limit(1);
  if (!question) {
    throw httpError("Question not found", 404);
  }

  const isCorrect = input.selectedIndex === question.correctIndex;

  const [existing] = await db
    .select()
    .from(schema.trainingQuizAnswers)
    .where(
      and(
        eq(schema.trainingQuizAnswers.enrollmentId, enrollmentId),
        eq(schema.trainingQuizAnswers.questionId, input.questionId),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.trainingQuizAnswers)
      .set({ selectedIndex: input.selectedIndex, isCorrect })
      .where(eq(schema.trainingQuizAnswers.id, existing.id))
      .returning();
    return { answer: updated!, isCorrect };
  }

  const [answer] = await db
    .insert(schema.trainingQuizAnswers)
    .values({
      enrollmentId,
      questionId: input.questionId,
      selectedIndex: input.selectedIndex,
      isCorrect,
    })
    .returning();
  if (!answer) throw new Error("Failed to save answer");
  return { answer, isCorrect };
}

/**
 * Grade a whole-quiz attempt: compute the score across every question in the
 * course, record the attempt, and update the enrollment to passed/failed. On
 * pass we complete the course and fire notifications + emails.
 */
export async function submitQuizAttempt(
  userId: string,
  courseId: string,
  input: SubmitQuizAttemptInput,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const [course] = await db
    .select()
    .from(schema.trainingCourses)
    .where(eq(schema.trainingCourses.id, courseId))
    .limit(1);
  if (!course) throw httpError("Course not found", 404);

  // Ensure enrollment exists (auto-enroll on first attempt).
  let enrollment = await findEnrollment(courseId, employeeId);
  if (!enrollment) {
    const [created] = await db
      .insert(schema.trainingEnrollments)
      .values({ courseId, employeeId, status: "in_progress" })
      .returning();
    if (!created) throw new Error("Failed to create enrollment");
    enrollment = created;
  }

  const questions = await getCourseQuestions(courseId);
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    throw httpError("This course has no quiz to submit.", 400);
  }

  const selectedByQuestion = new Map<string, number>();
  for (const a of input.answers) {
    selectedByQuestion.set(a.questionId, a.selectedIndex);
  }

  const results: TrainingAttemptAnswerRow[] = questions.map((q) => {
    const selectedIndex = selectedByQuestion.get(q.id) ?? -1;
    return {
      questionId: q.id,
      selectedIndex,
      isCorrect: selectedIndex === q.correctIndex,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= course.passingScore;
  const attemptNumber = enrollment.attemptCount + 1;

  const [attempt] = await db
    .insert(schema.trainingQuizAttempts)
    .values({
      enrollmentId: enrollment.id,
      courseId,
      attemptNumber,
      score,
      totalQuestions,
      correctCount,
      passed,
      answers: results,
    })
    .returning();
  if (!attempt) throw new Error("Failed to record attempt");

  const bestScore = Math.max(enrollment.bestScore ?? 0, score);
  const patch: Record<string, unknown> = {
    attemptCount: attemptNumber,
    bestScore,
    status: passed ? "passed" : "failed",
  };
  if (passed) {
    patch.passedAt = sql`now()`;
    patch.completedAt = sql`now()`;
  }

  const [updatedEnrollment] = await db
    .update(schema.trainingEnrollments)
    .set(patch)
    .where(eq(schema.trainingEnrollments.id, enrollment.id))
    .returning();
  if (!updatedEnrollment) throw new Error("Failed to update enrollment");

  if (passed) {
    await notifyCoursePassed(updatedEnrollment.id, employeeId, course, score);
  }

  return { attempt, enrollment: updatedEnrollment, results };
}

async function notifyCoursePassed(
  enrollmentId: string,
  employeeId: string,
  course: { id: string; title: string },
  score: number,
) {
  const db = getDb();
  const employee = await getEmployeeContact(employeeId);

  // Notify + email the employee.
  const [profile] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.employeeId, employeeId))
    .limit(1);

  if (profile) {
    await notify({
      kind: "training_passed",
      title: "Course completed",
      body: `You passed "${course.title}" with a score of ${score}%.`,
      link: `/training/${course.id}`,
      entityType: "training_course",
      entityId: course.id,
      audience: { kind: "users", ids: [profile.id] },
    });
  }

  if (employee) {
    await sendEmail({
      to: employee.email,
      subject: `You completed "${course.title}"`,
      html: renderEmail({
        heading: "Congratulations! 🎉",
        intro: `You passed <strong>${course.title}</strong> with a score of <strong>${score}%</strong>.`,
        bodyHtml: "Your completion has been recorded. Nice work!",
        ctaLabel: "View course",
        ctaUrl: courseUrl(course.id),
      }),
    });
  }

  // Notify + email the assigner (requester), if any.
  const [enrollment] = await db
    .select({ assignedByUserId: schema.trainingEnrollments.assignedByUserId })
    .from(schema.trainingEnrollments)
    .where(eq(schema.trainingEnrollments.id, enrollmentId))
    .limit(1);

  if (enrollment?.assignedByUserId) {
    await notify({
      kind: "training_passed",
      title: "Assigned training completed",
      body: `${employee?.name ?? "An employee"} passed "${course.title}" (${score}%).`,
      link: `/admin/training`,
      entityType: "training_course",
      entityId: course.id,
      audience: { kind: "users", ids: [enrollment.assignedByUserId] },
    });
    const requester = await getUserContact(enrollment.assignedByUserId);
    if (requester) {
      await sendEmail({
        to: requester.email,
        subject: `${employee?.name ?? "An employee"} completed "${course.title}"`,
        html: renderEmail({
          heading: "Training completed",
          intro: `<strong>${employee?.name ?? "An employee"}</strong> passed <strong>${course.title}</strong> with a score of <strong>${score}%</strong>.`,
          ctaLabel: "Review enrollments",
          ctaUrl: `${config.APP_BASE_URL.replace(/\/$/, "")}/admin/training`,
        }),
      });
    }
  }
}

export async function getMyProgress(userId: string, courseId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return null;

  const [course] = await db
    .select({ passingScore: schema.trainingCourses.passingScore })
    .from(schema.trainingCourses)
    .where(eq(schema.trainingCourses.id, courseId))
    .limit(1);

  const enrollment = await findEnrollment(courseId, employeeId);
  if (!enrollment) return null;

  const attempts = await db
    .select()
    .from(schema.trainingQuizAttempts)
    .where(eq(schema.trainingQuizAttempts.enrollmentId, enrollment.id))
    .orderBy(desc(schema.trainingQuizAttempts.attemptNumber));

  const questions = await getCourseQuestions(courseId);
  const totalQuestions = questions.length;

  return {
    enrollment,
    attempts,
    totalQuestions,
    passingScore: course?.passingScore ?? 70,
    bestScore: enrollment.bestScore,
  };
}

/**
 * Mark a course complete without a quiz (used for content-only courses, where
 * there are no questions to grade). Courses with quizzes are completed by
 * passing via `submitQuizAttempt`.
 */
export async function completeCourse(userId: string, courseId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const questions = await getCourseQuestions(courseId);
  if (questions.length > 0) {
    throw httpError(
      "This course has a quiz — pass it to complete the course.",
      400,
    );
  }

  const enrollment = await findEnrollment(courseId, employeeId);
  if (!enrollment) {
    throw httpError("Enrollment not found", 404);
  }

  const [updated] = await db
    .update(schema.trainingEnrollments)
    .set({
      status: "passed",
      passedAt: sql`now()`,
      completedAt: sql`now()`,
    })
    .where(eq(schema.trainingEnrollments.id, enrollment.id))
    .returning();
  if (!updated) throw httpError("Enrollment not found", 404);
  return updated;
}

// ─── Admin functions ─────────────────────────────────────────────────────────

export async function listAllCourses() {
  const db = getDb();
  const courses = await db
    .select()
    .from(schema.trainingCourses)
    .orderBy(desc(schema.trainingCourses.createdAt));
  if (courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  const lessons = await db
    .select()
    .from(schema.trainingLessons)
    .where(inArray(schema.trainingLessons.courseId, courseIds))
    .orderBy(schema.trainingLessons.sortOrder);

  const lessonIds = lessons.map((l) => l.id);
  const questions =
    lessonIds.length > 0
      ? await db
          .select()
          .from(schema.trainingQuizQuestions)
          .where(inArray(schema.trainingQuizQuestions.lessonId, lessonIds))
          .orderBy(schema.trainingQuizQuestions.sortOrder)
      : [];

  const questionsByLesson = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = questionsByLesson.get(q.lessonId) ?? [];
    list.push(q);
    questionsByLesson.set(q.lessonId, list);
  }

  const lessonsByCourse = new Map<
    string,
    (typeof lessons[number] & { questions: typeof questions })[]
  >();
  for (const l of lessons) {
    const list = lessonsByCourse.get(l.courseId) ?? [];
    list.push({ ...l, questions: questionsByLesson.get(l.id) ?? [] });
    lessonsByCourse.set(l.courseId, list);
  }

  return courses.map((c) => ({
    ...c,
    lessons: lessonsByCourse.get(c.id) ?? [],
  }));
}

export async function createCourse(
  input: CreateTrainingCourseInput,
  opts: { actorId?: string } = {},
) {
  const db = getDb();
  const [course] = await db
    .insert(schema.trainingCourses)
    .values({
      title: input.title,
      description: input.description,
      isPublished: input.isPublished,
      passingScore: input.passingScore,
    })
    .returning();
  if (!course) throw new Error("Failed to create course");

  if (course.isPublished) {
    await notify({
      kind: "new_training",
      title: "New training course available",
      body: course.title,
      link: `/training/${course.id}`,
      entityType: "training_course",
      entityId: course.id,
      audience: { kind: "all" },
      excludeUserId: opts.actorId,
    });
  }

  return course;
}

export async function updateCourse(
  id: string,
  input: Partial<CreateTrainingCourseInput>,
) {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.isPublished !== undefined) patch.isPublished = input.isPublished;
  if (input.passingScore !== undefined) patch.passingScore = input.passingScore;

  const [row] = await db
    .update(schema.trainingCourses)
    .set(patch)
    .where(eq(schema.trainingCourses.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCourse(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.trainingCourses)
    .where(eq(schema.trainingCourses.id, id))
    .returning({ id: schema.trainingCourses.id });
  return row ?? null;
}

export async function createLesson(
  courseId: string,
  input: Omit<CreateTrainingLessonInput, "courseId">,
) {
  const db = getDb();
  const [lesson] = await db
    .insert(schema.trainingLessons)
    .values({
      courseId,
      title: input.title,
      content: input.content,
      sortOrder: input.sortOrder,
    })
    .returning();
  if (!lesson) throw new Error("Failed to create lesson");
  return lesson;
}

export async function updateLesson(
  id: string,
  input: Partial<Omit<CreateTrainingLessonInput, "courseId">>,
) {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  if (Object.keys(patch).length === 0) return null;

  const [row] = await db
    .update(schema.trainingLessons)
    .set(patch)
    .where(eq(schema.trainingLessons.id, id))
    .returning();
  return row ?? null;
}

export async function deleteLesson(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.trainingLessons)
    .where(eq(schema.trainingLessons.id, id))
    .returning({ id: schema.trainingLessons.id });
  return row ?? null;
}

export async function createQuizQuestion(
  lessonId: string,
  input: Omit<CreateQuizQuestionInput, "lessonId">,
) {
  const db = getDb();
  const [question] = await db
    .insert(schema.trainingQuizQuestions)
    .values({
      lessonId,
      prompt: input.prompt,
      options: input.options,
      correctIndex: input.correctIndex,
      sortOrder: input.sortOrder,
    })
    .returning();
  if (!question) throw new Error("Failed to create quiz question");
  return question;
}

export async function updateQuizQuestion(
  id: string,
  input: Partial<Omit<CreateQuizQuestionInput, "lessonId">>,
) {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.prompt !== undefined) patch.prompt = input.prompt;
  if (input.options !== undefined) patch.options = input.options;
  if (input.correctIndex !== undefined) patch.correctIndex = input.correctIndex;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  if (Object.keys(patch).length === 0) return null;

  const [row] = await db
    .update(schema.trainingQuizQuestions)
    .set(patch)
    .where(eq(schema.trainingQuizQuestions.id, id))
    .returning();
  return row ?? null;
}

export async function deleteQuizQuestion(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.trainingQuizQuestions)
    .where(eq(schema.trainingQuizQuestions.id, id))
    .returning({ id: schema.trainingQuizQuestions.id });
  return row ?? null;
}

export async function listEnrollments(courseId: string) {
  const db = getDb();
  return db
    .select({
      id: schema.trainingEnrollments.id,
      courseId: schema.trainingEnrollments.courseId,
      employeeId: schema.trainingEnrollments.employeeId,
      status: schema.trainingEnrollments.status,
      assignedByUserId: schema.trainingEnrollments.assignedByUserId,
      assignedAt: schema.trainingEnrollments.assignedAt,
      dueAt: schema.trainingEnrollments.dueAt,
      attemptCount: schema.trainingEnrollments.attemptCount,
      bestScore: schema.trainingEnrollments.bestScore,
      passedAt: schema.trainingEnrollments.passedAt,
      completedAt: schema.trainingEnrollments.completedAt,
      createdAt: schema.trainingEnrollments.createdAt,
      employeeFirstName: schema.employees.firstName,
      employeeLastName: schema.employees.lastName,
      employeeTitle: schema.employees.title,
      employeeEmail: schema.employees.email,
    })
    .from(schema.trainingEnrollments)
    .innerJoin(
      schema.employees,
      eq(schema.trainingEnrollments.employeeId, schema.employees.id),
    )
    .where(eq(schema.trainingEnrollments.courseId, courseId))
    .orderBy(desc(schema.trainingEnrollments.createdAt));
}

/**
 * Assign ("email request") a course to one or more employees. Creates or
 * updates their enrollment with assignment metadata, then fires an in-app
 * notification (for those with accounts) and an email to each employee.
 */
export async function assignCourse(
  actorUserId: string,
  courseId: string,
  input: AssignTrainingInput,
) {
  const db = getDb();

  const [course] = await db
    .select()
    .from(schema.trainingCourses)
    .where(eq(schema.trainingCourses.id, courseId))
    .limit(1);
  if (!course) throw httpError("Course not found", 404);

  const dueAt = input.dueAt ? new Date(input.dueAt) : null;

  const employees = await db
    .select({
      employeeId: schema.employees.id,
      email: schema.employees.email,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      userId: schema.profiles.id,
    })
    .from(schema.employees)
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(inArray(schema.employees.id, input.employeeIds));

  const actor = await getUserContact(actorUserId);
  const actorName = actor?.name ?? "An administrator";
  const link = courseUrl(courseId);
  const assigned: { employeeId: string; enrollmentId: string }[] = [];

  for (const emp of employees) {
    const existing = await findEnrollment(courseId, emp.employeeId);

    let enrollmentId: string;
    if (existing) {
      // Don't downgrade a course someone already passed; otherwise (re)mark as
      // assigned so it surfaces in their "assigned" list.
      const nextStatus =
        existing.status === "passed" ? existing.status : "assigned";
      const [row] = await db
        .update(schema.trainingEnrollments)
        .set({
          assignedByUserId: actorUserId,
          assignedAt: sql`now()`,
          dueAt,
          status: nextStatus,
        })
        .where(eq(schema.trainingEnrollments.id, existing.id))
        .returning({ id: schema.trainingEnrollments.id });
      enrollmentId = row?.id ?? existing.id;
    } else {
      const [row] = await db
        .insert(schema.trainingEnrollments)
        .values({
          courseId,
          employeeId: emp.employeeId,
          status: "assigned",
          assignedByUserId: actorUserId,
          assignedAt: sql`now()`,
          dueAt,
        })
        .returning({ id: schema.trainingEnrollments.id });
      if (!row) continue;
      enrollmentId = row.id;
    }

    assigned.push({ employeeId: emp.employeeId, enrollmentId });

    const dueLine = dueAt
      ? `Please complete it by <strong>${dueAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.`
      : "";
    const messageLine = input.message
      ? `<em>"${input.message.replace(/</g, "&lt;")}"</em>`
      : "";

    if (emp.userId) {
      await notify({
        kind: "training_assigned",
        title: "Training assigned to you",
        body: `${actorName} assigned you "${course.title}"${dueAt ? ` (due ${dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}`,
        link: `/training/${courseId}`,
        entityType: "training_course",
        entityId: courseId,
        actorName,
        audience: { kind: "users", ids: [emp.userId] },
      });
    }

    await sendEmail({
      to: emp.email,
      subject: `Training assigned: ${course.title}`,
      html: renderEmail({
        heading: "You have a new training assignment",
        intro: `${actorName} has assigned you the course <strong>${course.title}</strong>.`,
        bodyHtml: [messageLine, dueLine].filter(Boolean).join("<br/><br/>"),
        ctaLabel: "Start course",
        ctaUrl: link,
      }),
    });
  }

  return { assigned, count: assigned.length };
}
