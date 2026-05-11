import { z } from "zod";

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
] as const;
export const questionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const surveyQuestionSchema = z.object({
  id: z.string().uuid(),
  surveyId: z.string().uuid(),
  prompt: z.string().min(1),
  type: questionTypeSchema,
  options: z.array(z.string()).nullable(),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});
export type SurveyQuestionRow = z.infer<typeof surveyQuestionSchema>;

export const surveySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  isAnonymous: z.boolean(),
  showResultsToAll: z.boolean(),
  isPublished: z.boolean(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SurveyRow = z.infer<typeof surveySchema>;

export const surveyWithQuestionsSchema = surveySchema.extend({
  questions: z.array(surveyQuestionSchema),
  hasResponded: z.boolean(),
  responseCount: z.number().int(),
});
export type SurveyWithQuestions = z.infer<typeof surveyWithQuestionsSchema>;

// --- Admin write payloads ---

export const questionDraftSchema = z.object({
  id: z.string().uuid().optional(),
  prompt: z.string().min(1).max(500),
  type: questionTypeSchema,
  options: z.array(z.string().min(1).max(200)).nullable().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type QuestionDraft = z.infer<typeof questionDraftSchema>;

export const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20_000).default(""),
  isAnonymous: z.boolean().default(false),
  showResultsToAll: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  opensAt: z.string().nullable().optional(),
  closesAt: z.string().nullable().optional(),
  questions: z.array(questionDraftSchema).default([]),
});
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const updateSurveySchema = createSurveySchema.partial();
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

// --- Submission payloads ---

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  textValue: z.string().max(10_000).nullable().optional(),
  ratingValue: z.number().int().min(1).max(5).nullable().optional(),
  choiceValues: z.array(z.string().max(200)).nullable().optional(),
});
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const submitResponseSchema = z.object({
  answers: z.array(submitAnswerSchema),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// --- Results ---

export const questionResultSchema = z.object({
  questionId: z.string().uuid(),
  prompt: z.string(),
  type: questionTypeSchema,
  totalAnswers: z.number().int(),
  textAnswers: z.array(z.string()).optional(),
  choiceCounts: z.record(z.string(), z.number().int()).optional(),
  ratingAverage: z.number().nullable().optional(),
  ratingDistribution: z.record(z.string(), z.number().int()).optional(),
});
export type QuestionResult = z.infer<typeof questionResultSchema>;

export const surveyResultsSchema = z.object({
  survey: surveySchema,
  responseCount: z.number().int(),
  results: z.array(questionResultSchema),
});
export type SurveyResults = z.infer<typeof surveyResultsSchema>;
