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
});
export type MeResponse = z.infer<typeof meResponseSchema>;