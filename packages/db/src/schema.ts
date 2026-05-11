import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
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

export const companyEvents = pgTable(
  "company_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    location: text("location"),
    url: text("url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    startsIdx: index("company_events_starts_idx").on(t.startsAt),
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
export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  showResultsToAll: boolean("show_results_to_all").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  // null/[] = visible to everyone; otherwise only employees whose department
  // (or sub_department) is in this list can see the survey.
  targetDepartments: jsonb("target_departments").$type<string[] | null>(),
  opensAt: timestamp("opens_at", { withTimezone: true }),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const surveyQuestions = pgTable(
  "survey_questions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    type: text("type").notNull(),
    options: jsonb("options").$type<string[] | null>(),
    isRequired: boolean("is_required").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    surveyIdx: index("survey_questions_survey_idx").on(t.surveyId, t.sortOrder),
  }),
);

export const surveyResponses = pgTable(
  "survey_responses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    // nullable: when survey.is_anonymous is true, we deliberately discard the
    // user id at the API layer so even backend logs can't tie a response to
    // a person.
    responderId: uuid("responder_id"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    surveyIdx: index("survey_responses_survey_idx").on(t.surveyId),
    // For non-anon surveys we enforce one response per user via the API
    // (a partial unique index would also work but the API check is enough).
    responderIdx: index("survey_responses_responder_idx").on(t.responderId),
  }),
);

export const surveyAnswers = pgTable(
  "survey_answers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => surveyResponses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => surveyQuestions.id, { onDelete: "cascade" }),
    textValue: text("text_value"),
    ratingValue: integer("rating_value"),
    choiceValues: jsonb("choice_values").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    responseIdx: index("survey_answers_response_idx").on(t.responseId),
    questionIdx: index("survey_answers_question_idx").on(t.questionId),
  }),
);

export type CompanyEvent = typeof companyEvents.$inferSelect;
export type NewCompanyEvent = typeof companyEvents.$inferInsert;
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestions.$inferInsert;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
export type SurveyAnswer = typeof surveyAnswers.$inferSelect;
export type NewSurveyAnswer = typeof surveyAnswers.$inferInsert;