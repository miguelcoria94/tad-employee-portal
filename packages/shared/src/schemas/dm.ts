import { z } from "zod";

export const dmConversationSchema = z.object({
  id: z.string().uuid(),
  participant1Id: z.string().uuid(),
  participant2Id: z.string().uuid(),
  lastMessageAt: z.string().nullable(),
  createdAt: z.string(),
});
export type DmConversationRow = z.infer<typeof dmConversationSchema>;

export const dmMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderUserId: z.string().uuid(),
  body: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type DmMessageRow = z.infer<typeof dmMessageSchema>;

export const createDmMessageSchema = z.object({
  recipientUserId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
});
export type CreateDmMessageInput = z.infer<typeof createDmMessageSchema>;
