import { z } from "zod";

export const emergencyContactSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  name: z.string(),
  relationship: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EmergencyContactRow = z.infer<typeof emergencyContactSchema>;

export const createEmergencyContactSchema = z.object({
  employeeId: z.string().uuid(),
  name: z.string().min(1).max(200),
  relationship: z.string().min(1).max(100),
  phone: z.string().min(1).max(40),
  email: z.string().email().max(320).nullable().optional(),
  isPrimary: z.boolean().default(false),
});
export type CreateEmergencyContactInput = z.infer<
  typeof createEmergencyContactSchema
>;

export const updateEmergencyContactSchema = createEmergencyContactSchema
  .omit({ employeeId: true })
  .partial();
export type UpdateEmergencyContactInput = z.infer<
  typeof updateEmergencyContactSchema
>;
