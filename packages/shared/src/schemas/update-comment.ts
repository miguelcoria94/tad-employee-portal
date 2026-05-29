import { z } from "zod";

export const updateCommentSchema = z.object({
  id: z.string().uuid(),
  updateId: z.string().uuid(),
  authorUserId: z.string().uuid().nullable(),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UpdateCommentRow = z.infer<typeof updateCommentSchema>;

export const createUpdateCommentSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type CreateUpdateCommentInput = z.infer<
  typeof createUpdateCommentSchema
>;

export const editUpdateCommentSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type EditUpdateCommentInput = z.infer<typeof editUpdateCommentSchema>;
