import { z } from "zod";

export const FEEDBACK_STATUSES = ["pending", "completed", "declined"] as const;
export const feedbackStatusSchema = z.enum(FEEDBACK_STATUSES);
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;

export const FEEDBACK_REQUEST_TYPES = ["self", "about_other"] as const;
export const feedbackRequestTypeSchema = z.enum(FEEDBACK_REQUEST_TYPES);
export type FeedbackRequestType = z.infer<typeof feedbackRequestTypeSchema>;

// A single question on a feedback request or template. `id` is a stable,
// client-generated key (slug or uuid) used to tie answers back to questions.
export const feedbackQuestionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(500),
});
export type FeedbackQuestion = z.infer<typeof feedbackQuestionSchema>;

// Default question set used for the simple "feedback about myself" flow.
export const DEFAULT_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  { id: "doing_well", label: "What is one thing I'm doing well?" },
  { id: "improve", label: "What could I do differently to improve?" },
  { id: "anything_else", label: "Anything else you'd like to share?" },
];

export const createFeedbackRequestSchema = z.object({
  requestType: feedbackRequestTypeSchema.default("self"),
  subjectEmployeeId: z.string().uuid(),
  // Respondents identified by employee id; the API resolves these to the
  // linked auth user ids (employees aren't directly addressable by userId on
  // the client and may not all have accounts).
  respondentEmployeeIds: z.array(z.string().uuid()).min(1).max(20),
  questions: z.array(feedbackQuestionSchema).min(1).max(10),
  templateId: z.string().uuid().nullable().optional(),
  isAnonymous: z.boolean().optional().default(false),
});
export type CreateFeedbackRequestInput = z.infer<
  typeof createFeedbackRequestSchema
>;

export const feedbackAnswerSchema = z.object({
  questionId: z.string().min(1).max(64),
  label: z.string().min(1).max(500),
  // Sanitized rich-text HTML produced by the editor.
  answerHtml: z.string().min(1).max(20_000),
});
export type FeedbackAnswer = z.infer<typeof feedbackAnswerSchema>;

export const submitFeedbackResponseSchema = z.object({
  answers: z.array(feedbackAnswerSchema).min(1).max(10),
});
export type SubmitFeedbackResponseInput = z.infer<
  typeof submitFeedbackResponseSchema
>;

// ─── Templates ──────────────────────────────────────────────────────────────

export const FEEDBACK_TEMPLATE_SCOPES = ["private", "shared"] as const;
export const feedbackTemplateScopeSchema = z.enum(FEEDBACK_TEMPLATE_SCOPES);
export type FeedbackTemplateScope = z.infer<typeof feedbackTemplateScopeSchema>;

export const createFeedbackTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  questions: z.array(feedbackQuestionSchema).min(1).max(10),
  scope: feedbackTemplateScopeSchema.optional().default("private"),
});
export type CreateFeedbackTemplateInput = z.infer<
  typeof createFeedbackTemplateSchema
>;
