import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Note: profiles.id is a FK to auth.users(id), but we don't declare auth.users
// here because the auth schema is owned by Supabase and our migration role
// can't create or reference tables in it via CREATE TABLE. The FK constraint
// is added separately in policies/000_profiles_auth_fk.sql.

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    title: text("title").notNull(),
    department: text("department").notNull(),
    subDepartment: text("sub_department"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    phone: text("phone"),
    startDate: date("start_date"),
    managerId: uuid("manager_id").references((): any => employees.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("employees_email_idx").on(t.email),
    departmentIdx: index("employees_department_idx").on(t.department),
    managerIdx: index("employees_manager_idx").on(t.managerId),
  }),
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employeeIdx: index("profiles_employee_idx").on(t.employeeId),
    adminIdx: index("profiles_admin_idx").on(t.isAdmin),
  }),
);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    nameIdx: uniqueIndex("departments_name_idx").on(t.name),
  }),
);

export const companyUpdates = pgTable(
  "company_updates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    publishedIdx: index("company_updates_published_idx").on(t.publishedAt),
  }),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type CompanyUpdate = typeof companyUpdates.$inferSelect;
export type NewCompanyUpdate = typeof companyUpdates.$inferInsert;