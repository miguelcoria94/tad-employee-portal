import { z } from "zod";
import { employeeSchema } from "./employee.js";

export const profileSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid().nullable(),
  isAdmin: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

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