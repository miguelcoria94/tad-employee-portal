import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateSurveyInput,
  QuestionDraft,
  QuestionResult,
  QuestionType,
  SubmitResponseInput,
  SurveyResults,
  SurveyWithQuestions,
  UpdateSurveyInput,
} from "@tadhealth/shared";

function nullableDate(s: string | null | undefined) {
  return s ? new Date(s) : null;
}

export async function listSurveysForUser(userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.surveys)
    .where(eq(schema.surveys.isPublished, true))
    .orderBy(desc(schema.surveys.createdAt));

  if (rows.length === 0) return [];

  const counts = await db
    .select({
      surveyId: schema.surveyResponses.surveyId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.surveyResponses)
    .where(
      inArray(
        schema.surveyResponses.surveyId,
        rows.map((r) => r.id),
      ),
    )
    .groupBy(schema.surveyResponses.surveyId);
  const countBy = new Map(counts.map((c) => [c.surveyId, c.count]));

  const myResponses = await db
    .select({ surveyId: schema.surveyResponses.surveyId })
    .from(schema.surveyResponses)
    .where(eq(schema.surveyResponses.responderId, userId));
  const respondedSet = new Set(myResponses.map((r) => r.surveyId));

  return rows.map((s) => ({
    ...s,
    responseCount: countBy.get(s.id) ?? 0,
    hasResponded: respondedSet.has(s.id),
  }));
}

export async function getSurveyForUser(
  surveyId: string,
  userId: string,
): Promise<SurveyWithQuestions | null> {
  const db = getDb();
  const [survey] = await db
    .select()
    .from(schema.surveys)
    .where(eq(schema.surveys.id, surveyId))
    .limit(1);
  if (!survey || !survey.isPublished) return null;

  const questions = await db
    .select()
    .from(schema.surveyQuestions)
    .where(eq(schema.surveyQuestions.surveyId, surveyId))
    .orderBy(asc(schema.surveyQuestions.sortOrder));

  const [myResp] = await db
    .select({ id: schema.surveyResponses.id })
    .from(schema.surveyResponses)
    .where(
      and(
        eq(schema.surveyResponses.surveyId, surveyId),
        eq(schema.surveyResponses.responderId, userId),
      ),
    )
    .limit(1);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.surveyResponses)
    .where(eq(schema.surveyResponses.surveyId, surveyId));

  return {
    ...toJSON(survey),
    questions: questions.map((q) => ({
      ...q,
      type: q.type as QuestionType,
      options: (q.options ?? null) as string[] | null,
      createdAt: q.createdAt.toISOString(),
    })),
    hasResponded: !!myResp,
    responseCount: count,
  };
}

function toJSON<T extends { createdAt: Date; updatedAt: Date; opensAt: Date | null; closesAt: Date | null }>(
  s: T,
) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    opensAt: s.opensAt ? s.opensAt.toISOString() : null,
    closesAt: s.closesAt ? s.closesAt.toISOString() : null,
  };
}

export async function submitSurveyResponse(
  surveyId: string,
  userId: string,
  input: SubmitResponseInput,
) {
  const db = getDb();
  const [survey] = await db
    .select()
    .from(schema.surveys)
    .where(eq(schema.surveys.id, surveyId))
    .limit(1);
  if (!survey || !survey.isPublished) {
    throw Object.assign(new Error("Survey not found"), { statusCode: 404 });
  }
  const now = new Date();
  if (survey.opensAt && survey.opensAt > now) {
    throw Object.assign(new Error("Survey not open yet"), { statusCode: 400 });
  }
  if (survey.closesAt && survey.closesAt < now) {
    throw Object.assign(new Error("Survey is closed"), { statusCode: 400 });
  }

  // For non-anon surveys, enforce one response per user.
  if (!survey.isAnonymous) {
    const [existing] = await db
      .select({ id: schema.surveyResponses.id })
      .from(schema.surveyResponses)
      .where(
        and(
          eq(schema.surveyResponses.surveyId, surveyId),
          eq(schema.surveyResponses.responderId, userId),
        ),
      )
      .limit(1);
    if (existing) {
      throw Object.assign(new Error("You've already responded to this survey"), {
        statusCode: 409,
      });
    }
  }

  // Validate that submitted answers reference real questions on this survey
  // and that required questions are present.
  const questions = await db
    .select()
    .from(schema.surveyQuestions)
    .where(eq(schema.surveyQuestions.surveyId, surveyId));
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  for (const q of questions) {
    if (q.isRequired) {
      const a = input.answers.find((x) => x.questionId === q.id);
      if (!a) {
        throw Object.assign(
          new Error(`Question "${q.prompt}" is required`),
          { statusCode: 400 },
        );
      }
    }
  }

  // Create the response, deliberately stripping the user id for anon surveys.
  const inserted = await db
    .insert(schema.surveyResponses)
    .values({
      surveyId,
      responderId: survey.isAnonymous ? null : userId,
    })
    .returning();
  const response = inserted[0];
  if (!response) {
    throw Object.assign(new Error("Failed to create response"), {
      statusCode: 500,
    });
  }

  const answerRows = input.answers
    .filter((a) => questionMap.has(a.questionId))
    .map((a) => ({
      responseId: response.id,
      questionId: a.questionId,
      textValue: a.textValue ?? null,
      ratingValue: a.ratingValue ?? null,
      choiceValues: a.choiceValues ?? null,
    }));
  if (answerRows.length) {
    await db.insert(schema.surveyAnswers).values(answerRows);
  }

  return { id: response.id };
}

export async function getSurveyResults(
  surveyId: string,
): Promise<SurveyResults | null> {
  const db = getDb();
  const [survey] = await db
    .select()
    .from(schema.surveys)
    .where(eq(schema.surveys.id, surveyId))
    .limit(1);
  if (!survey) return null;

  const questions = await db
    .select()
    .from(schema.surveyQuestions)
    .where(eq(schema.surveyQuestions.surveyId, surveyId))
    .orderBy(asc(schema.surveyQuestions.sortOrder));

  const answers = await db
    .select()
    .from(schema.surveyAnswers)
    .where(
      inArray(
        schema.surveyAnswers.questionId,
        questions.map((q) => q.id),
      ),
    );

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.surveyResponses)
    .where(eq(schema.surveyResponses.surveyId, surveyId));

  const results: QuestionResult[] = questions.map((q) => {
    const qAnswers = answers.filter((a) => a.questionId === q.id);
    const total = qAnswers.length;

    if (q.type === "short_text" || q.type === "long_text") {
      return {
        questionId: q.id,
        prompt: q.prompt,
        type: q.type as QuestionResult["type"],
        totalAnswers: total,
        textAnswers: qAnswers
          .map((a) => a.textValue ?? "")
          .filter((v) => v.length > 0),
      };
    }

    if (q.type === "rating") {
      const values = qAnswers
        .map((a) => a.ratingValue)
        .filter((v): v is number => typeof v === "number");
      const avg = values.length
        ? values.reduce((s, v) => s + v, 0) / values.length
        : null;
      const dist: Record<string, number> = {};
      for (let i = 1; i <= 5; i++) dist[String(i)] = 0;
      for (const v of values) dist[String(v)] = (dist[String(v)] ?? 0) + 1;
      return {
        questionId: q.id,
        prompt: q.prompt,
        type: "rating",
        totalAnswers: total,
        ratingAverage: avg,
        ratingDistribution: dist,
      };
    }

    // single_choice or multi_choice
    const counts: Record<string, number> = {};
    for (const opt of q.options ?? []) counts[opt] = 0;
    for (const a of qAnswers) {
      if (q.type === "single_choice") {
        const v = a.textValue;
        if (v) counts[v] = (counts[v] ?? 0) + 1;
      } else {
        const vs = (a.choiceValues ?? []) as string[];
        for (const v of vs) counts[v] = (counts[v] ?? 0) + 1;
      }
    }
    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type as QuestionResult["type"],
      totalAnswers: total,
      choiceCounts: counts,
    };
  });

  return {
    survey: toJSON(survey),
    responseCount: count,
    results,
  };
}

// ── Admin write paths ───────────────────────────────────────────────────────

export async function adminCreateSurvey(input: CreateSurveyInput) {
  const db = getDb();
  const inserted = await db
    .insert(schema.surveys)
    .values({
      title: input.title,
      description: input.description,
      isAnonymous: input.isAnonymous,
      showResultsToAll: input.showResultsToAll,
      isPublished: input.isPublished,
      opensAt: nullableDate(input.opensAt),
      closesAt: nullableDate(input.closesAt),
    })
    .returning();
  const survey = inserted[0];
  if (!survey) {
    throw new Error("Failed to create survey");
  }

  if (input.questions.length) {
    await db.insert(schema.surveyQuestions).values(
      input.questions.map((q, i) => ({
        surveyId: survey.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options ?? null,
        isRequired: q.isRequired,
        sortOrder: q.sortOrder || i,
      })),
    );
  }
  return survey;
}

export async function adminUpdateSurvey(id: string, input: UpdateSurveyInput) {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.isAnonymous !== undefined) patch.isAnonymous = input.isAnonymous;
  if (input.showResultsToAll !== undefined)
    patch.showResultsToAll = input.showResultsToAll;
  if (input.isPublished !== undefined) patch.isPublished = input.isPublished;
  if (input.opensAt !== undefined) patch.opensAt = nullableDate(input.opensAt);
  if (input.closesAt !== undefined)
    patch.closesAt = nullableDate(input.closesAt);

  const [row] = await db
    .update(schema.surveys)
    .set(patch)
    .where(eq(schema.surveys.id, id))
    .returning();
  if (!row) return null;

  // If questions were provided, replace the set wholesale. This keeps the
  // admin UI's edit flow simple at the cost of breaking the FK from existing
  // answers — so we only do it before any responses have been collected.
  if (input.questions) {
    const [respCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.surveyId, id));
    if ((respCount?.count ?? 0) > 0) {
      throw Object.assign(
        new Error("Cannot change questions after responses are collected"),
        { statusCode: 409 },
      );
    }
    await db
      .delete(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.surveyId, id));
    if (input.questions.length) {
      await db.insert(schema.surveyQuestions).values(
        input.questions.map((q: QuestionDraft, i: number) => ({
          surveyId: id,
          prompt: q.prompt,
          type: q.type,
          options: q.options ?? null,
          isRequired: q.isRequired ?? false,
          sortOrder: q.sortOrder ?? i,
        })),
      );
    }
  }

  return row;
}

export async function adminDeleteSurvey(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.surveys)
    .where(eq(schema.surveys.id, id))
    .returning({ id: schema.surveys.id });
  return row ?? null;
}
