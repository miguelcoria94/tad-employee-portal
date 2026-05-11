import { z } from "zod";

export const companyUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string(),
  publishedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyUpdate = z.infer<typeof companyUpdateSchema>;

export const createCompanyUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20_000).default(""),
  publishedAt: z.string().optional(),
});
export type CreateCompanyUpdateInput = z.infer<typeof createCompanyUpdateSchema>;

export const updateCompanyUpdateSchema = createCompanyUpdateSchema.partial();
export type UpdateCompanyUpdateInput = z.infer<typeof updateCompanyUpdateSchema>;
