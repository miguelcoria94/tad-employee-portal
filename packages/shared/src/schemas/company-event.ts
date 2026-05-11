import { z } from "zod";

export const companyEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  location: z.string().nullable(),
  url: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyEvent = z.infer<typeof companyEventSchema>;

export const createCompanyEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20_000).default(""),
  location: z.string().max(200).nullable().optional(),
  url: z.string().url().max(500).nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
});
export type CreateCompanyEventInput = z.infer<typeof createCompanyEventSchema>;

export const updateCompanyEventSchema = createCompanyEventSchema.partial();
export type UpdateCompanyEventInput = z.infer<typeof updateCompanyEventSchema>;
