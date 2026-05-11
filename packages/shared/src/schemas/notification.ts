import { z } from "zod";

export const NOTIFICATION_KINDS = [
  "new_update",
  "new_event",
  "new_survey",
  "new_resource",
  "survey_response",
  "changelog",
] as const;
export const notificationKindSchema = z.enum(NOTIFICATION_KINDS);
export type NotificationKind = z.infer<typeof notificationKindSchema>;

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: notificationKindSchema,
  title: z.string(),
  body: z.string(),
  link: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  actorName: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationRow = z.infer<typeof notificationSchema>;
