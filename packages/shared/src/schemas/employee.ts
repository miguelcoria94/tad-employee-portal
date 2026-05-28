import { z } from "zod";

export const DEPARTMENTS = [
  "Executive",
  "Sales",
  "Customer Experience",
  "Marketing",
  "Policy & TA",
  "Operations",
  "Engineering",
  "Product & Design",
  "Product & Engineering",
  "Careers & HR",
] as const;

export const departmentSchema = z.enum(DEPARTMENTS);
export type Department = z.infer<typeof departmentSchema>;

export const employeeSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().nullable(),
  title: z.string().min(1),
  department: z.string().min(1),
  subDepartment: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  managerId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).nullable().optional(),
  title: z.string().min(1).max(160),
  department: z.string().min(1).max(80),
  subDepartment: z.string().max(80).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  startDate: z.string().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const listEmployeesQuerySchema = z.object({
  q: z.string().max(120).optional(),
  department: z.string().max(80).optional(),
  includeInactive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) =>
      typeof v === "string" ? v === "true" || v === "1" : !!v,
    ),
});
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export function fullName(e: Pick<Employee, "firstName" | "lastName">): string {
  return e.lastName ? `${e.firstName} ${e.lastName}` : e.firstName;
}

export function initials(e: Pick<Employee, "firstName" | "lastName">): string {
  const first = e.firstName.charAt(0).toUpperCase();
  const last = (e.lastName ?? "").charAt(0).toUpperCase();
  return last ? `${first}${last}` : first;
}