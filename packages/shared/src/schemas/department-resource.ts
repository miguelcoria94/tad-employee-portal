import { z } from "zod";

export const RESOURCE_KINDS = ["tool", "document"] as const;
export const resourceKindSchema = z.enum(RESOURCE_KINDS);
export type ResourceKind = z.infer<typeof resourceKindSchema>;

// Sentinel department name used for company-wide resources visible to every
// employee (e.g. the handbook/benefits). See packages/db/src/schema.ts.
export const COMPANY_RESOURCE_SCOPE = "Company";

export const departmentResourceSchema = z.object({
  id: z.string().uuid(),
  departmentName: z.string().min(1),
  kind: resourceKindSchema,
  title: z.string().min(1),
  url: z.string().nullable(),
  content: z.string().nullable(),
  linkLabel: z.string(),
  category: z.string().nullable(),
  documentDate: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DepartmentResourceRow = z.infer<typeof departmentResourceSchema>;

export const createDepartmentResourceSchema = z
  .object({
    departmentName: z.string().min(1).max(80),
    kind: resourceKindSchema,
    title: z.string().min(1).max(200),
    url: z.string().url().max(2000).nullable().optional(),
    content: z.string().max(200_000).nullable().optional(),
    linkLabel: z.string().min(1).max(40).default("Link"),
    category: z.string().max(80).nullable().optional(),
    documentDate: z.string().nullable().optional(), // YYYY-MM-DD or ISO
    sortOrder: z.number().int().optional(),
  })
  .refine((v) => !!(v.url && v.url.trim()) || !!(v.content && v.content.trim()), {
    message: "A resource needs either a URL or document content.",
    path: ["url"],
  });
export type CreateDepartmentResourceInput = z.infer<
  typeof createDepartmentResourceSchema
>;

// Partial for PATCH; the url-or-content refinement only applies on create since
// an update may legitimately touch a single field.
export const updateDepartmentResourceSchema = z.object({
  departmentName: z.string().min(1).max(80).optional(),
  kind: resourceKindSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000).nullable().optional(),
  content: z.string().max(200_000).nullable().optional(),
  linkLabel: z.string().min(1).max(40).optional(),
  category: z.string().max(80).nullable().optional(),
  documentDate: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateDepartmentResourceInput = z.infer<
  typeof updateDepartmentResourceSchema
>;
