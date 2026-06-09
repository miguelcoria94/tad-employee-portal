import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateTimeOffRequestInput,
  DecideTimeOffRequestInput,
  SetBalancesInput,
  TimeOffKind,
  TimeOffStatus,
} from "@tadhealth/shared";
import { countDays } from "@tadhealth/shared";
import { notify } from "./notifications.js";

const decidedBy = alias(schema.employees, "decided_by");

async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ employeeId: schema.profiles.employeeId })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return row?.employeeId ?? null;
}

function selectColumns() {
  return {
    id: schema.timeOffRequests.id,
    employeeId: schema.timeOffRequests.employeeId,
    kind: schema.timeOffRequests.kind,
    startsOn: schema.timeOffRequests.startsOn,
    endsOn: schema.timeOffRequests.endsOn,
    note: schema.timeOffRequests.note,
    status: schema.timeOffRequests.status,
    decidedByEmployeeId: schema.timeOffRequests.decidedByEmployeeId,
    decidedAt: schema.timeOffRequests.decidedAt,
    decisionNote: schema.timeOffRequests.decisionNote,
    createdAt: schema.timeOffRequests.createdAt,
    updatedAt: schema.timeOffRequests.updatedAt,
    employeeFirstName: schema.employees.firstName,
    employeeLastName: schema.employees.lastName,
    employeeTitle: schema.employees.title,
    decidedByFirstName: decidedBy.firstName,
    decidedByLastName: decidedBy.lastName,
  };
}

function toRow(r: Awaited<ReturnType<typeof listMine>>[number]) {
  return r;
}
void toRow;

export async function listMine(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];

  return db
    .select(selectColumns())
    .from(schema.timeOffRequests)
    .leftJoin(
      schema.employees,
      eq(schema.timeOffRequests.employeeId, schema.employees.id),
    )
    .leftJoin(
      decidedBy,
      eq(schema.timeOffRequests.decidedByEmployeeId, decidedBy.id),
    )
    .where(eq(schema.timeOffRequests.employeeId, employeeId))
    .orderBy(desc(schema.timeOffRequests.startsOn));
}

export async function listAll(opts: { status?: TimeOffStatus | null }) {
  const db = getDb();
  const where = opts.status
    ? eq(schema.timeOffRequests.status, opts.status)
    : undefined;
  return db
    .select(selectColumns())
    .from(schema.timeOffRequests)
    .leftJoin(
      schema.employees,
      eq(schema.timeOffRequests.employeeId, schema.employees.id),
    )
    .leftJoin(
      decidedBy,
      eq(schema.timeOffRequests.decidedByEmployeeId, decidedBy.id),
    )
    .where(where)
    .orderBy(desc(schema.timeOffRequests.createdAt));
}

export async function createRequest(
  userId: string,
  input: CreateTimeOffRequestInput,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw Object.assign(new Error("No linked employee profile"), {
      statusCode: 400,
    });
  }

  const days = countDays(input.startsOn, input.endsOn);
  const year = new Date(input.startsOn + "T00:00:00").getFullYear();

  const [balance] = await db
    .select()
    .from(schema.timeOffBalances)
    .where(
      and(
        eq(schema.timeOffBalances.employeeId, employeeId),
        eq(schema.timeOffBalances.kind, input.kind),
        eq(schema.timeOffBalances.year, year),
      ),
    )
    .limit(1);

  if (balance) {
    const remaining = balance.totalDays - balance.usedDays;
    if (days > remaining) {
      throw Object.assign(
        new Error(
          `Insufficient ${input.kind} balance: ${days} day(s) requested but only ${remaining} remaining`,
        ),
        { statusCode: 400 },
      );
    }
  }

  const [inserted] = await db
    .insert(schema.timeOffRequests)
    .values({
      employeeId,
      kind: input.kind,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      note: input.note ?? null,
    })
    .returning();
  if (!inserted) {
    throw new Error("Failed to create time-off request");
  }

  // Notify admins. Fetch the requester's name for the body.
  const [emp] = await db
    .select({
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  const name = emp?.lastName
    ? `${emp.firstName} ${emp.lastName}`
    : (emp?.firstName ?? "Someone");

  await notify({
    kind: "time_off_request",
    title: "New time-off request",
    body: `${name} requested ${input.kind} from ${input.startsOn} to ${input.endsOn}`,
    link: "/admin/time-off",
    entityType: "time_off_request",
    entityId: inserted.id,
    actorName: name,
    audience: { kind: "admins" },
    excludeUserId: userId,
  });

  return inserted;
}

export async function cancelOwnRequest(userId: string, id: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return null;

  const [row] = await db
    .update(schema.timeOffRequests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(schema.timeOffRequests.id, id),
        eq(schema.timeOffRequests.employeeId, employeeId),
        eq(schema.timeOffRequests.status, "pending"),
      ),
    )
    .returning();
  return row ?? null;
}

export async function decideRequest(
  adminUserId: string,
  id: string,
  input: DecideTimeOffRequestInput,
) {
  const db = getDb();
  const adminEmployeeId = await getEmployeeIdForUser(adminUserId);

  const [before] = await db
    .select()
    .from(schema.timeOffRequests)
    .where(eq(schema.timeOffRequests.id, id))
    .limit(1);
  if (!before) return null;

  const [row] = await db
    .update(schema.timeOffRequests)
    .set({
      status: input.status,
      decisionNote: input.decisionNote ?? null,
      decidedByEmployeeId: adminEmployeeId,
      decidedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.timeOffRequests.id, id))
    .returning();
  if (!row) return null;

  const days = countDays(before.startsOn, before.endsOn);
  const year = new Date(before.startsOn + "T00:00:00").getFullYear();
  if (input.status === "approved") {
    await db
      .update(schema.timeOffBalances)
      .set({ usedDays: sql`used_days + ${days}`, updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.timeOffBalances.employeeId, before.employeeId),
          eq(schema.timeOffBalances.kind, before.kind),
          eq(schema.timeOffBalances.year, year),
        ),
      );
  }

  // Notify the requester (find the auth user whose profile.employee_id matches)
  const [requesterProfile] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.employeeId, before.employeeId))
    .limit(1);

  if (requesterProfile) {
    const verb = input.status === "approved" ? "approved" : "declined";
    await notify({
      kind: "time_off_decision",
      title: `Your time-off was ${verb}`,
      body: `${before.kind} from ${before.startsOn} to ${before.endsOn}`,
      link: "/time-off",
      entityType: "time_off_request",
      entityId: id,
      audience: { kind: "users", ids: [requesterProfile.id] },
    });
  }

  return row;
}

export async function getMyBalances(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];
  const year = new Date().getFullYear();
  return db
    .select()
    .from(schema.timeOffBalances)
    .where(
      and(
        eq(schema.timeOffBalances.employeeId, employeeId),
        eq(schema.timeOffBalances.year, year),
      ),
    );
}

export async function getAllBalances(year: number) {
  const db = getDb();
  return db
    .select({
      id: schema.timeOffBalances.id,
      employeeId: schema.timeOffBalances.employeeId,
      kind: schema.timeOffBalances.kind,
      totalDays: schema.timeOffBalances.totalDays,
      usedDays: schema.timeOffBalances.usedDays,
      year: schema.timeOffBalances.year,
      createdAt: schema.timeOffBalances.createdAt,
      updatedAt: schema.timeOffBalances.updatedAt,
      employeeFirstName: schema.employees.firstName,
      employeeLastName: schema.employees.lastName,
    })
    .from(schema.timeOffBalances)
    .innerJoin(
      schema.employees,
      eq(schema.timeOffBalances.employeeId, schema.employees.id),
    )
    .where(eq(schema.timeOffBalances.year, year));
}

export async function bulkSetBalance(input: SetBalancesInput) {
  const db = getDb();
  let ids = input.employeeIds;
  if (!ids || ids.length === 0) {
    const rows = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(eq(schema.employees.isActive, true));
    ids = rows.map((r) => r.id);
  }

  for (const employeeId of ids) {
    await db
      .insert(schema.timeOffBalances)
      .values({
        employeeId,
        kind: input.kind,
        totalDays: input.totalDays,
        year: input.year,
      })
      .onConflictDoUpdate({
        target: [
          schema.timeOffBalances.employeeId,
          schema.timeOffBalances.kind,
          schema.timeOffBalances.year,
        ],
        set: {
          totalDays: input.totalDays,
          updatedAt: sql`now()`,
        },
      });
  }

  return { updated: ids.length };
}
