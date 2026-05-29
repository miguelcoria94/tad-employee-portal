import { z } from "zod";

export function slugifyDepartment(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const departmentRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DepartmentRow = z.infer<typeof departmentRowSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).default(""),
  isPrivate: z.boolean().optional().default(false),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const departmentManagerSchema = z.object({
  userId: z.string().uuid(),
  employeeId: z.string().uuid().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  title: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
});
export type DepartmentManager = z.infer<typeof departmentManagerSchema>;

export const addDepartmentManagerSchema = z.object({
  employeeId: z.string().uuid(),
});
export type AddDepartmentManagerInput = z.infer<
  typeof addDepartmentManagerSchema
>;
