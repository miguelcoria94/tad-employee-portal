import { z } from "zod";
import { employeeSchema } from "./employee.js";

export const profileSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid().nullable(),
  isAdmin: z.boolean(),
  onboardingSteps: z.array(z.string()),
  onboardingDismissedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateOnboardingSchema = z.object({
  completedSteps: z.array(z.string()).optional(),
  dismissed: z.boolean().optional(),
});
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;

export const meResponseSchema = z.object({
  profile: profileSchema,
  employee: employeeSchema.nullable(),
  manager: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string().nullable(),
      title: z.string(),
    })
    .nullable(),
  managedDepartmentIds: z.array(z.string().uuid()),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

// Fields an employee can edit on their own profile.
export const updateMyProfileSchema = z.object({
  location: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;