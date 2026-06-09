import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateInternalJobInput,
  CreateJobReferralInput,
  JobReferralStatus,
  UpdateInternalJobInput,
  UpdateJobReferralInput,
} from "@tadhealth/shared";
import { RESUMES_BUCKET, supabaseAdmin } from "../lib/supabase.js";
import { notify } from "./notifications.js";

const RESUME_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ employeeId: schema.profiles.employeeId })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return row?.employeeId ?? null;
}

function openJobsFilter() {
  return and(
    eq(schema.internalJobs.isPublished, true),
    or(
      isNull(schema.internalJobs.closesAt),
      gt(schema.internalJobs.closesAt, sql`now()`),
    ),
  );
}

export async function listOpenJobs() {
  const db = getDb();
  return db
    .select()
    .from(schema.internalJobs)
    .where(openJobsFilter())
    .orderBy(desc(schema.internalJobs.publishedAt));
}

export async function listAllJobs() {
  const db = getDb();
  return db
    .select()
    .from(schema.internalJobs)
    .orderBy(desc(schema.internalJobs.publishedAt));
}

export async function getOpenJob(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.internalJobs)
    .where(and(eq(schema.internalJobs.id, id), openJobsFilter()))
    .limit(1);
  return row ?? null;
}

export async function getJob(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.internalJobs)
    .where(eq(schema.internalJobs.id, id))
    .limit(1);
  return row ?? null;
}

export async function createJob(
  input: CreateInternalJobInput,
  opts: { actorId?: string } = {},
) {
  const db = getDb();
  const values = {
    title: input.title,
    department: input.department,
    location: input.location ?? null,
    employmentType: input.employmentType,
    description: input.description,
    requirements: input.requirements,
    isPublished: input.isPublished,
    ...(input.publishedAt ? { publishedAt: new Date(input.publishedAt) } : {}),
    closesAt: input.closesAt ? new Date(input.closesAt) : null,
  };
  const [row] = await db.insert(schema.internalJobs).values(values).returning();
  if (row?.isPublished) {
    await notify({
      kind: "new_job",
      title: "New internal job posting",
      body: row.title,
      link: `/internal-jobs/${row.id}`,
      entityType: "internal_job",
      entityId: row.id,
      audience: { kind: "all" },
      excludeUserId: opts.actorId,
    });
  }
  return row;
}

export async function updateJob(id: string, input: UpdateInternalJobInput) {
  const db = getDb();
  const [before] = await db
    .select({ isPublished: schema.internalJobs.isPublished })
    .from(schema.internalJobs)
    .where(eq(schema.internalJobs.id, id))
    .limit(1);
  if (!before) return null;

  const patch: Record<string, unknown> = { ...input, updatedAt: sql`now()` };
  if (input.publishedAt) patch.publishedAt = new Date(input.publishedAt);
  if (input.closesAt !== undefined) {
    patch.closesAt = input.closesAt ? new Date(input.closesAt) : null;
  }
  if (input.location !== undefined) patch.location = input.location ?? null;

  const [row] = await db
    .update(schema.internalJobs)
    .set(patch)
    .where(eq(schema.internalJobs.id, id))
    .returning();
  return row ?? null;
}

export async function deleteJob(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.internalJobs)
    .where(eq(schema.internalJobs.id, id))
    .returning({ id: schema.internalJobs.id });
  return row ?? null;
}

function referralSelect() {
  return {
    id: schema.jobReferrals.id,
    jobId: schema.jobReferrals.jobId,
    referrerEmployeeId: schema.jobReferrals.referrerEmployeeId,
    candidateName: schema.jobReferrals.candidateName,
    candidateEmail: schema.jobReferrals.candidateEmail,
    candidateLinkedIn: schema.jobReferrals.candidateLinkedIn,
    resumeUrl: schema.jobReferrals.resumeUrl,
    note: schema.jobReferrals.note,
    status: schema.jobReferrals.status,
    createdAt: schema.jobReferrals.createdAt,
    updatedAt: schema.jobReferrals.updatedAt,
    jobTitle: schema.internalJobs.title,
    referrerFirstName: schema.employees.firstName,
    referrerLastName: schema.employees.lastName,
  };
}

function mapReferralRow(r: {
  id: string;
  jobId: string;
  referrerEmployeeId: string;
  candidateName: string;
  candidateEmail: string;
  candidateLinkedIn: string | null;
  resumeUrl: string | null;
  note: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  jobTitle: string;
  referrerFirstName: string;
  referrerLastName: string | null;
}) {
  return {
    id: r.id,
    jobId: r.jobId,
    referrerEmployeeId: r.referrerEmployeeId,
    candidateName: r.candidateName,
    candidateEmail: r.candidateEmail,
    candidateLinkedIn: r.candidateLinkedIn,
    resumeUrl: r.resumeUrl,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    jobTitle: r.jobTitle,
    referrerName: r.referrerLastName
      ? `${r.referrerFirstName} ${r.referrerLastName}`
      : r.referrerFirstName,
  };
}

/**
 * Upload a resume to Supabase Storage and attach the signed URL to an
 * existing referral row.
 */
export async function uploadResumeForReferral(
  referralId: string,
  file: { buffer: Buffer; mimetype: string; filename?: string },
) {
  if (!RESUME_MIME.has(file.mimetype)) {
    throw Object.assign(
      new Error(`Unsupported file type: ${file.mimetype}. Accepted: PDF, DOC, DOCX`),
      { statusCode: 415 },
    );
  }

  const db = getDb();
  const [referral] = await db
    .select({ id: schema.jobReferrals.id })
    .from(schema.jobReferrals)
    .where(eq(schema.jobReferrals.id, referralId))
    .limit(1);
  if (!referral) return null;

  const ext = extname(file.filename ?? "") || ".pdf";
  const path = `${referralId}/${randomUUID()}${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(RESUMES_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  const { data: signedData, error: signErr } = await supabaseAdmin.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signErr) throw signErr;
  const resumeUrl = signedData.signedUrl;

  const [updated] = await db
    .update(schema.jobReferrals)
    .set({ resumeUrl, updatedAt: sql`now()` })
    .where(eq(schema.jobReferrals.id, referralId))
    .returning();

  return updated ?? null;
}

export async function listMyReferrals(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];

  const rows = await db
    .select(referralSelect())
    .from(schema.jobReferrals)
    .innerJoin(
      schema.internalJobs,
      eq(schema.jobReferrals.jobId, schema.internalJobs.id),
    )
    .innerJoin(
      schema.employees,
      eq(schema.jobReferrals.referrerEmployeeId, schema.employees.id),
    )
    .where(eq(schema.jobReferrals.referrerEmployeeId, employeeId))
    .orderBy(desc(schema.jobReferrals.createdAt));

  return rows.map(mapReferralRow);
}

export async function listAllReferrals(opts: {
  status?: JobReferralStatus | null;
}) {
  const db = getDb();
  const where = opts.status
    ? eq(schema.jobReferrals.status, opts.status)
    : undefined;

  const rows = await db
    .select(referralSelect())
    .from(schema.jobReferrals)
    .innerJoin(
      schema.internalJobs,
      eq(schema.jobReferrals.jobId, schema.internalJobs.id),
    )
    .innerJoin(
      schema.employees,
      eq(schema.jobReferrals.referrerEmployeeId, schema.employees.id),
    )
    .where(where)
    .orderBy(desc(schema.jobReferrals.createdAt));

  return rows.map(mapReferralRow);
}

export async function createReferral(
  userId: string,
  jobId: string,
  input: CreateJobReferralInput,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw Object.assign(new Error("No linked employee profile"), {
      statusCode: 400,
    });
  }

  const job = await getOpenJob(jobId);
  if (!job) {
    throw Object.assign(new Error("Job not found or no longer accepting referrals"), {
      statusCode: 404,
    });
  }

  const [inserted] = await db
    .insert(schema.jobReferrals)
    .values({
      jobId,
      referrerEmployeeId: employeeId,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      candidateLinkedIn: input.candidateLinkedIn ?? null,
      note: input.note ?? null,
    })
    .returning();
  if (!inserted) throw new Error("Failed to create referral");

  const [emp] = await db
    .select({
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  const referrerName = emp?.lastName
    ? `${emp.firstName} ${emp.lastName}`
    : (emp?.firstName ?? "Someone");

  await notify({
    kind: "job_referral",
    title: "New employee referral",
    body: `${referrerName} referred ${input.candidateName} for ${job.title}`,
    link: "/admin/internal-jobs",
    entityType: "job_referral",
    entityId: inserted.id,
    actorName: referrerName,
    audience: { kind: "admins" },
    excludeUserId: userId,
  });

  return inserted;
}

export async function updateReferral(
  id: string,
  input: UpdateJobReferralInput,
) {
  const db = getDb();
  const [row] = await db
    .update(schema.jobReferrals)
    .set({ status: input.status, updatedAt: sql`now()` })
    .where(eq(schema.jobReferrals.id, id))
    .returning();
  return row ?? null;
}
