import { z } from "zod";

export const TIME_OFF_KINDS = ["vacation", "sick", "personal", "other"] as const;
export const timeOffKindSchema = z.enum(TIME_OFF_KINDS);
export type TimeOffKind = z.infer<typeof timeOffKindSchema>;

export const TIME_OFF_STATUSES = [
  "pending",
  "approved",
  "declined",
  "cancelled",
] as const;
export const timeOffStatusSchema = z.enum(TIME_OFF_STATUSES);
export type TimeOffStatus = z.infer<typeof timeOffStatusSchema>;

export const timeOffRequestSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  kind: timeOffKindSchema,
  startsOn: z.string(), // YYYY-MM-DD
  endsOn: z.string(),
  note: z.string().nullable(),
  status: timeOffStatusSchema,
  decidedByEmployeeId: z.string().uuid().nullable(),
  decidedAt: z.string().nullable(),
  decisionNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Joined fields for admin list:
  employeeName: z.string().optional(),
  employeeTitle: z.string().optional(),
  decidedByName: z.string().nullable().optional(),
});
export type TimeOffRequestRow = z.infer<typeof timeOffRequestSchema>;

export const createTimeOffRequestSchema = z
  .object({
    kind: timeOffKindSchema,
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => d.endsOn >= d.startsOn, {
    message: "End date must be on or after the start date",
    path: ["endsOn"],
  });
export type CreateTimeOffRequestInput = z.infer<
  typeof createTimeOffRequestSchema
>;

export const decideTimeOffRequestSchema = z.object({
  status: z.enum(["approved", "declined"]),
  decisionNote: z.string().max(2000).nullable().optional(),
});
export type DecideTimeOffRequestInput = z.infer<
  typeof decideTimeOffRequestSchema
>;

export const timeOffBalanceSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  kind: timeOffKindSchema,
  totalDays: z.number().int(),
  usedDays: z.number().int(),
  year: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TimeOffBalance = z.infer<typeof timeOffBalanceSchema>;

export const setBalancesSchema = z.object({
  kind: timeOffKindSchema,
  totalDays: z.number().int().min(0).max(365),
  year: z.number().int().min(2020).max(2099),
  employeeIds: z.array(z.string().uuid()).optional(),
});
export type SetBalancesInput = z.infer<typeof setBalancesSchema>;

export function countDays(startsOn: string, endsOn: string): number {
  const start = new Date(startsOn + "T00:00:00");
  const end = new Date(endsOn + "T00:00:00");
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}