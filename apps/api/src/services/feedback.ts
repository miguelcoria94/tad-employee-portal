import { and, desc, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateFeedbackRequestInput,
  CreateFeedbackTemplateInput,
  FeedbackAnswer,
  FeedbackQuestion,
  SubmitFeedbackResponseInput,
} from "@tadhealth/shared";
import { notify } from "./notifications.js";
import { listManagedDepartmentIds } from "./department-managers.js";
import { sanitizeRichText } from "../lib/sanitize.js";

const subjectEmployee = alias(schema.employees, "subject_employee");
const respondentEmployee = alias(schema.employees, "respondent_employee");
const requesterEmployee = alias(schema.employees, "requester_employee");
const respondentProfile = alias(schema.profiles, "respondent_profile");
const requesterProfile = alias(schema.profiles, "requester_profile");

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

async function getEmployeeName(employeeId: string): Promise<string> {
  const db = getDb();
  const [emp] = await db
    .select({
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  if (!emp) return "Someone";
  return emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.firstName;
}

/**
 * Whether a user is allowed to request feedback ABOUT OTHER people. True for
 * admins and anyone who heads at least one department.
 */
export async function canRequestAboutOthers(userId: string): Promise<boolean> {
  const db = getDb();
  const [profile] = await db
    .select({ isAdmin: schema.profiles.isAdmin })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  if (profile?.isAdmin) return true;
  const managed = await listManagedDepartmentIds(userId);
  return managed.length > 0;
}

/** Resolve employee ids to the auth users linked to them (those with accounts). */
async function resolveRespondents(employeeIds: string[]) {
  if (employeeIds.length === 0) return [];
  const db = getDb();
  return db
    .select({
      employeeId: schema.employees.id,
      userId: schema.profiles.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.employees)
    .innerJoin(
      schema.profiles,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(inArray(schema.employees.id, employeeIds));
}

export async function requestFeedback(
  requesterUserId: string,
  input: CreateFeedbackRequestInput,
) {
  const db = getDb();
  const requesterEmployeeId = await getEmployeeIdForUser(requesterUserId);
  if (!requesterEmployeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const isSelf = input.subjectEmployeeId === requesterEmployeeId;
  if (!isSelf) {
    const allowed = await canRequestAboutOthers(requesterUserId);
    if (!allowed) {
      throw httpError(
        "Only admins and department heads can request feedback about other people.",
        403,
      );
    }
  }
  const requestType: "self" | "about_other" = isSelf ? "self" : "about_other";

  const respondents = await resolveRespondents(input.respondentEmployeeIds);
  // Don't let someone request feedback from the subject about themselves only,
  // but otherwise allow self as a respondent is harmless. Filter respondents
  // that resolved to a real account.
  if (respondents.length === 0) {
    throw httpError(
      "None of the selected respondents have an account yet — ask them to sign in once.",
      400,
    );
  }

  const questions: FeedbackQuestion[] = input.questions;

  const rows = [];
  for (const respondent of respondents) {
    const [inserted] = await db
      .insert(schema.feedbackRequests)
      .values({
        requesterUserId,
        subjectEmployeeId: input.subjectEmployeeId,
        respondentUserId: respondent.userId,
        requestType,
        questions,
        templateId: input.templateId ?? null,
        isAnonymous: input.isAnonymous ?? false,
        status: "pending",
      })
      .returning();
    if (inserted) rows.push(inserted);
  }

  const subjectName = await getEmployeeName(input.subjectEmployeeId);
  const requesterName = await getEmployeeName(requesterEmployeeId);

  for (const row of rows) {
    await notify({
      kind: "feedback_request",
      title: "Feedback requested",
      body:
        requestType === "self"
          ? `${requesterName} asked you to share feedback about them`
          : `${requesterName} asked you to provide feedback about ${subjectName}`,
      link: "/feedback",
      entityType: "feedback_request",
      entityId: row.id,
      actorName: requesterName,
      audience: { kind: "users", ids: [row.respondentUserId] },
    });
  }

  return rows;
}

export async function listMyPendingFeedback(userId: string) {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.feedbackRequests.id,
      requestType: schema.feedbackRequests.requestType,
      questions: schema.feedbackRequests.questions,
      isAnonymous: schema.feedbackRequests.isAnonymous,
      createdAt: schema.feedbackRequests.createdAt,
      subjectId: subjectEmployee.id,
      subjectFirstName: subjectEmployee.firstName,
      subjectLastName: subjectEmployee.lastName,
      subjectAvatarUrl: subjectEmployee.avatarUrl,
      subjectTitle: subjectEmployee.title,
      requesterFirstName: requesterEmployee.firstName,
      requesterLastName: requesterEmployee.lastName,
    })
    .from(schema.feedbackRequests)
    .leftJoin(
      subjectEmployee,
      eq(schema.feedbackRequests.subjectEmployeeId, subjectEmployee.id),
    )
    .leftJoin(
      requesterProfile,
      eq(schema.feedbackRequests.requesterUserId, requesterProfile.id),
    )
    .leftJoin(
      requesterEmployee,
      eq(requesterProfile.employeeId, requesterEmployee.id),
    )
    .where(
      and(
        eq(schema.feedbackRequests.respondentUserId, userId),
        eq(schema.feedbackRequests.status, "pending"),
      ),
    )
    .orderBy(desc(schema.feedbackRequests.createdAt));

  return rows.map((r) => ({
    id: r.id,
    requestType: r.requestType,
    questions: (r.questions ?? []) as FeedbackQuestion[],
    isAnonymous: r.isAnonymous,
    createdAt: r.createdAt,
    subjectEmployee: {
      id: r.subjectId,
      firstName: r.subjectFirstName,
      lastName: r.subjectLastName,
      avatarUrl: r.subjectAvatarUrl,
      title: r.subjectTitle,
    },
    requesterName: r.requesterFirstName
      ? `${r.requesterFirstName} ${r.requesterLastName ?? ""}`.trim()
      : "Someone",
  }));
}

export async function listFeedbackIRequested(userId: string) {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.feedbackRequests.id,
      requestType: schema.feedbackRequests.requestType,
      isAnonymous: schema.feedbackRequests.isAnonymous,
      status: schema.feedbackRequests.status,
      createdAt: schema.feedbackRequests.createdAt,
      updatedAt: schema.feedbackRequests.updatedAt,
      subjectId: subjectEmployee.id,
      subjectFirstName: subjectEmployee.firstName,
      subjectLastName: subjectEmployee.lastName,
      subjectAvatarUrl: subjectEmployee.avatarUrl,
      respondentFirstName: respondentEmployee.firstName,
      respondentLastName: respondentEmployee.lastName,
    })
    .from(schema.feedbackRequests)
    .leftJoin(
      subjectEmployee,
      eq(schema.feedbackRequests.subjectEmployeeId, subjectEmployee.id),
    )
    .leftJoin(
      respondentProfile,
      eq(schema.feedbackRequests.respondentUserId, respondentProfile.id),
    )
    .leftJoin(
      respondentEmployee,
      eq(respondentProfile.employeeId, respondentEmployee.id),
    )
    .where(eq(schema.feedbackRequests.requesterUserId, userId))
    .orderBy(desc(schema.feedbackRequests.createdAt));

  return rows.map((r) => ({
    id: r.id,
    requestType: r.requestType,
    isAnonymous: r.isAnonymous,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    subjectEmployee: {
      id: r.subjectId,
      firstName: r.subjectFirstName,
      lastName: r.subjectLastName,
      avatarUrl: r.subjectAvatarUrl,
    },
    respondent: {
      firstName: r.respondentFirstName,
      lastName: r.respondentLastName,
    },
  }));
}

export async function listFeedbackAboutMe(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];

  const rows = await db
    .select({
      requestId: schema.feedbackRequests.id,
      isAnonymous: schema.feedbackRequests.isAnonymous,
      questions: schema.feedbackRequests.questions,
      createdAt: schema.feedbackResponses.createdAt,
      answers: schema.feedbackResponses.answers,
      respondentFirstName: respondentEmployee.firstName,
      respondentLastName: respondentEmployee.lastName,
    })
    .from(schema.feedbackResponses)
    .innerJoin(
      schema.feedbackRequests,
      eq(schema.feedbackResponses.requestId, schema.feedbackRequests.id),
    )
    .leftJoin(
      respondentEmployee,
      eq(schema.feedbackResponses.respondentEmployeeId, respondentEmployee.id),
    )
    .where(eq(schema.feedbackRequests.subjectEmployeeId, employeeId))
    .orderBy(desc(schema.feedbackResponses.createdAt));

  return rows.map((r) => ({
    requestId: r.requestId,
    isAnonymous: r.isAnonymous,
    questions: (r.questions ?? []) as FeedbackQuestion[],
    answers: (r.answers ?? []) as FeedbackAnswer[],
    completedAt: r.createdAt,
    respondentName: r.isAnonymous
      ? null
      : r.respondentFirstName
        ? `${r.respondentFirstName} ${r.respondentLastName ?? ""}`.trim()
        : null,
  }));
}

export async function submitFeedback(
  userId: string,
  requestId: string,
  input: SubmitFeedbackResponseInput,
) {
  const db = getDb();

  const [request] = await db
    .select()
    .from(schema.feedbackRequests)
    .where(
      and(
        eq(schema.feedbackRequests.id, requestId),
        eq(schema.feedbackRequests.respondentUserId, userId),
        eq(schema.feedbackRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw httpError(
      "Feedback request not found, not yours, or already completed",
      404,
    );
  }

  // Validate answers correspond to the request's question snapshot.
  const validIds = new Set(
    (request.questions as FeedbackQuestion[]).map((q) => q.id),
  );
  const cleaned: FeedbackAnswer[] = input.answers
    .filter((a) => validIds.has(a.questionId))
    .map((a) => ({
      questionId: a.questionId,
      label: a.label,
      answerHtml: sanitizeRichText(a.answerHtml),
    }))
    .filter((a) => a.answerHtml.length > 0);
  if (cleaned.length === 0) {
    throw httpError("Answers do not match the requested questions.", 400);
  }

  const respondentEmployeeId = await getEmployeeIdForUser(userId);
  if (!respondentEmployeeId) {
    throw httpError("No linked employee profile", 400);
  }

  const [response] = await db
    .insert(schema.feedbackResponses)
    .values({
      requestId,
      respondentUserId: userId,
      respondentEmployeeId,
      answers: cleaned,
    })
    .returning();

  await db
    .update(schema.feedbackRequests)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(schema.feedbackRequests.id, requestId));

  const respondentName = await getEmployeeName(respondentEmployeeId);
  const subjectName = await getEmployeeName(request.subjectEmployeeId);

  await notify({
    kind: "feedback_received",
    title: "Feedback received",
    body: request.isAnonymous
      ? `Someone submitted feedback about ${subjectName}`
      : `${respondentName} submitted feedback about ${subjectName}`,
    link: "/feedback",
    entityType: "feedback_request",
    entityId: requestId,
    actorName: request.isAnonymous ? null : respondentName,
    audience: { kind: "users", ids: [request.requesterUserId] },
  });

  return response;
}

export async function declineFeedback(userId: string, requestId: string) {
  const db = getDb();

  const [row] = await db
    .update(schema.feedbackRequests)
    .set({ status: "declined", updatedAt: new Date() })
    .where(
      and(
        eq(schema.feedbackRequests.id, requestId),
        eq(schema.feedbackRequests.respondentUserId, userId),
        eq(schema.feedbackRequests.status, "pending"),
      ),
    )
    .returning();

  return row ?? null;
}

export async function listAllFeedback() {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.feedbackRequests.id,
      requesterUserId: schema.feedbackRequests.requesterUserId,
      requestType: schema.feedbackRequests.requestType,
      isAnonymous: schema.feedbackRequests.isAnonymous,
      status: schema.feedbackRequests.status,
      createdAt: schema.feedbackRequests.createdAt,
      updatedAt: schema.feedbackRequests.updatedAt,
      subjectFirstName: subjectEmployee.firstName,
      subjectLastName: subjectEmployee.lastName,
      respondentFirstName: respondentEmployee.firstName,
      respondentLastName: respondentEmployee.lastName,
    })
    .from(schema.feedbackRequests)
    .leftJoin(
      subjectEmployee,
      eq(schema.feedbackRequests.subjectEmployeeId, subjectEmployee.id),
    )
    .leftJoin(
      respondentProfile,
      eq(schema.feedbackRequests.respondentUserId, respondentProfile.id),
    )
    .leftJoin(
      respondentEmployee,
      eq(respondentProfile.employeeId, respondentEmployee.id),
    )
    .orderBy(desc(schema.feedbackRequests.createdAt));

  return rows;
}

// ─── Templates ────────────────────────────────────────────────────────────

export async function listFeedbackTemplates(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.feedbackTemplates)
    .where(
      or(
        eq(schema.feedbackTemplates.ownerUserId, userId),
        eq(schema.feedbackTemplates.scope, "shared"),
      ),
    )
    .orderBy(desc(schema.feedbackTemplates.updatedAt));
}

export async function createFeedbackTemplate(
  userId: string,
  input: CreateFeedbackTemplateInput,
) {
  const db = getDb();
  const [row] = await db
    .insert(schema.feedbackTemplates)
    .values({
      ownerUserId: userId,
      name: input.name,
      questions: input.questions,
      scope: input.scope ?? "private",
    })
    .returning();
  return row;
}

export async function deleteFeedbackTemplate(userId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.feedbackTemplates)
    .where(
      and(
        eq(schema.feedbackTemplates.id, id),
        eq(schema.feedbackTemplates.ownerUserId, userId),
      ),
    )
    .returning({ id: schema.feedbackTemplates.id });
  return row ?? null;
}
