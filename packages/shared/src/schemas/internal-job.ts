import { z } from "zod";

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
] as const;
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

export const JOB_REFERRAL_STATUSES = [
  "submitted",
  "reviewing",
  "contacted",
  "hired",
  "passed",
] as const;
export const jobReferralStatusSchema = z.enum(JOB_REFERRAL_STATUSES);
export type JobReferralStatus = z.infer<typeof jobReferralStatusSchema>;

export const internalJobSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  department: z.string().min(1),
  location: z.string().nullable(),
  employmentType: employmentTypeSchema,
  description: z.string(),
  requirements: z.string(),
  isPublished: z.boolean(),
  publishedAt: z.string(),
  closesAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InternalJob = z.infer<typeof internalJobSchema>;

export const createInternalJobSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().min(1).max(120),
  location: z.string().max(200).nullable().optional(),
  employmentType: employmentTypeSchema.default("full_time"),
  description: z.string().max(20_000).default(""),
  requirements: z.string().max(20_000).default(""),
  isPublished: z.boolean().default(true),
  publishedAt: z.string().optional(),
  closesAt: z.string().nullable().optional(),
});
export type CreateInternalJobInput = z.infer<typeof createInternalJobSchema>;

export const updateInternalJobSchema = createInternalJobSchema.partial();
export type UpdateInternalJobInput = z.infer<typeof updateInternalJobSchema>;

export const createJobReferralSchema = z.object({
  candidateName: z.string().min(1).max(200),
  candidateEmail: z.string().email().max(320),
  candidateLinkedIn: z.string().url().max(500).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});
export type CreateJobReferralInput = z.infer<typeof createJobReferralSchema>;

export const updateJobReferralSchema = z.object({
  status: jobReferralStatusSchema,
});
export type UpdateJobReferralInput = z.infer<typeof updateJobReferralSchema>;

export const jobReferralSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  referrerEmployeeId: z.string().uuid(),
  candidateName: z.string(),
  candidateEmail: z.string(),
  candidateLinkedIn: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  note: z.string().nullable(),
  status: jobReferralStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  jobTitle: z.string().optional(),
  referrerName: z.string().optional(),
});
export type JobReferralRow = z.infer<typeof jobReferralSchema>;

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

export const JOB_REFERRAL_STATUS_LABELS: Record<JobReferralStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  contacted: "Contacted",
  hired: "Hired",
  passed: "Passed",
};
