import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
  pgTable,
  primaryKey,
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
    location: text("location"),
    startDate: date("start_date"),
    birthday: date("birthday"),
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
    onboardingSteps: jsonb("onboarding_steps")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    onboardingDismissedAt: timestamp("onboarding_dismissed_at", {
      withTimezone: true,
    }),
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
    // false (default) = visible to every signed-in employee.
    // true = only visible to members of this department (and admins).
    isPrivate: boolean("is_private").notNull().default(false),
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

export const departmentManagers = pgTable(
  "department_managers",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    // profiles.id (auth user id). FK to profiles is added in policies SQL so
    // we don't need to chain RLS through a join here.
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.departmentId, t.userId] }),
    userIdx: index("department_managers_user_idx").on(t.userId),
  }),
);

export const departmentResources = pgTable(
  "department_resources",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // We key on department name (not id) to match how employees.department
    // is stored; keeps the join logic simple even when the match is via
    // sub_department.
    // The sentinel department name "Company" marks a company-wide resource that
    // every employee can see (used for the handbook/benefits), independent of
    // their own department. The employee-facing list and the assistant both
    // always include "Company" resources for every user.
    departmentName: text("department_name").notNull(),
    kind: text("kind").notNull(), // 'tool' | 'document'
    title: text("title").notNull(),
    url: text("url"),
    // Sanitized rich-text HTML for "document" resources authored inline (vs a
    // plain URL link). When present the resource is rendered as a formatted
    // document; url becomes optional.
    content: text("content"),
    linkLabel: text("link_label").notNull().default("Link"),
    category: text("category"),
    documentDate: date("document_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    deptKindIdx: index("department_resources_dept_kind_idx").on(
      t.departmentName,
      t.kind,
      t.sortOrder,
    ),
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

export const internalJobs = pgTable(
  "internal_jobs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    department: text("department").notNull(),
    location: text("location"),
    employmentType: text("employment_type").notNull().default("full_time"),
    description: text("description").notNull().default(""),
    requirements: text("requirements").notNull().default(""),
    isPublished: boolean("is_published").notNull().default(true),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    publishedIdx: index("internal_jobs_published_idx").on(
      t.isPublished,
      t.publishedAt,
    ),
    departmentIdx: index("internal_jobs_department_idx").on(t.department),
  }),
);

export const jobReferrals = pgTable(
  "job_referrals",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    jobId: uuid("job_id")
      .notNull()
      .references(() => internalJobs.id, { onDelete: "cascade" }),
    referrerEmployeeId: uuid("referrer_employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    candidateName: text("candidate_name").notNull(),
    candidateEmail: text("candidate_email").notNull(),
    candidateLinkedIn: text("candidate_linkedin"),
    resumeUrl: text("resume_url"),
    note: text("note"),
    status: text("status").notNull().default("submitted"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    jobIdx: index("job_referrals_job_idx").on(t.jobId, t.createdAt),
    referrerIdx: index("job_referrals_referrer_idx").on(
      t.referrerEmployeeId,
      t.createdAt,
    ),
    statusIdx: index("job_referrals_status_idx").on(t.status, t.createdAt),
  }),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export const updateComments = pgTable(
  "update_comments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    updateId: uuid("update_id")
      .notNull()
      .references(() => companyUpdates.id, { onDelete: "cascade" }),
    // References auth.users(id); kept loose since auth schema is owned by
    // Supabase. Null when an admin deletes the author's profile.
    authorUserId: uuid("author_user_id"),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    updateIdx: index("update_comments_update_idx").on(t.updateId, t.createdAt),
  }),
);

export const timeOffRequests = pgTable(
  "time_off_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'vacation' | 'sick' | 'personal' | 'other'
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    note: text("note"),
    status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'declined' | 'cancelled'
    decidedByEmployeeId: uuid("decided_by_employee_id").references(
      () => employees.id,
      { onDelete: "set null" },
    ),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employeeIdx: index("time_off_employee_idx").on(t.employeeId, t.startsOn),
    statusIdx: index("time_off_status_idx").on(t.status, t.startsOn),
  }),
);

export const timeOffBalances = pgTable(
  "time_off_balances",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    totalDays: integer("total_days").notNull().default(0),
    usedDays: integer("used_days").notNull().default(0),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employeeKindYearIdx: uniqueIndex("time_off_balances_emp_kind_year").on(
      t.employeeId,
      t.kind,
      t.year,
    ),
    yearIdx: index("time_off_balances_year_idx").on(t.year),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // References auth.users(id) but we don't declare the FK here for the
    // same reason profiles.id doesn't — auth schema is owned by Supabase.
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull(), // 'new_update' | 'new_event' | 'new_survey' | 'new_resource' | 'survey_response' | 'changelog'
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    actorName: text("actor_name"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(
      t.userId,
      t.readAt,
      t.createdAt,
    ),
  }),
);

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type DepartmentResource = typeof departmentResources.$inferSelect;
export type NewDepartmentResource = typeof departmentResources.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type NewTimeOffRequest = typeof timeOffRequests.$inferInsert;
export type TimeOffBalance = typeof timeOffBalances.$inferSelect;
export type NewTimeOffBalance = typeof timeOffBalances.$inferInsert;
export type UpdateComment = typeof updateComments.$inferSelect;
export type NewUpdateComment = typeof updateComments.$inferInsert;
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
export type InternalJob = typeof internalJobs.$inferSelect;
export type NewInternalJob = typeof internalJobs.$inferInsert;
export type JobReferral = typeof jobReferrals.$inferSelect;
export type NewJobReferral = typeof jobReferrals.$inferInsert;
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestions.$inferInsert;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
export type SurveyAnswer = typeof surveyAnswers.$inferSelect;
export type NewSurveyAnswer = typeof surveyAnswers.$inferInsert;

// ─── Feedback System ────────────────────────────────────────────────────────

// A single question on a feedback request/template. `id` is a stable client-
// generated key used to tie answers back to their question.
export type FeedbackQuestion = { id: string; label: string };
// A respondent's answer to one question. `answerHtml` is sanitized rich text.
export type FeedbackAnswer = {
  questionId: string;
  label: string;
  answerHtml: string;
};

// Reusable question sets that requesters can save and pick from.
export const feedbackTemplates = pgTable(
  "feedback_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerUserId: uuid("owner_user_id").notNull(),
    name: text("name").notNull(),
    questions: jsonb("questions")
      .$type<FeedbackQuestion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // 'private' = only the owner sees it; 'shared' = visible to all requesters.
    scope: text("scope").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    ownerIdx: index("feedback_templates_owner_idx").on(t.ownerUserId),
    scopeIdx: index("feedback_templates_scope_idx").on(t.scope),
  }),
);

export const feedbackRequests = pgTable(
  "feedback_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    requesterUserId: uuid("requester_user_id").notNull(),
    respondentUserId: uuid("respondent_user_id").notNull(),
    subjectEmployeeId: uuid("subject_employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    // 'self' = requester asking for feedback about themselves.
    // 'about_other' = admin/department head requesting about someone else.
    requestType: text("request_type").notNull().default("self"),
    // Snapshot of the questions at request time, so editing a template later
    // doesn't change in-flight requests.
    questions: jsonb("questions")
      .$type<FeedbackQuestion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    templateId: uuid("template_id").references(() => feedbackTemplates.id, {
      onDelete: "set null",
    }),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    requesterIdx: index("feedback_requests_requester_idx").on(t.requesterUserId),
    respondentIdx: index("feedback_requests_respondent_idx").on(t.respondentUserId),
    subjectIdx: index("feedback_requests_subject_idx").on(t.subjectEmployeeId),
    statusIdx: index("feedback_requests_status_idx").on(t.status),
  }),
);

export const feedbackResponses = pgTable(
  "feedback_responses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    requestId: uuid("request_id")
      .notNull()
      .references(() => feedbackRequests.id, { onDelete: "cascade" }),
    respondentUserId: uuid("respondent_user_id").notNull(),
    respondentEmployeeId: uuid("respondent_employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    // Rich-text answers keyed to the request's question snapshot.
    answers: jsonb("answers")
      .$type<FeedbackAnswer[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    requestIdx: index("feedback_responses_request_idx").on(t.requestId),
    respondentIdx: index("feedback_responses_respondent_idx").on(
      t.respondentUserId,
    ),
    respondentEmployeeIdx: index("feedback_responses_respondent_emp_idx").on(
      t.respondentEmployeeId,
    ),
  }),
);

export type FeedbackTemplate = typeof feedbackTemplates.$inferSelect;
export type NewFeedbackTemplate = typeof feedbackTemplates.$inferInsert;
export type FeedbackRequest = typeof feedbackRequests.$inferSelect;
export type NewFeedbackRequest = typeof feedbackRequests.$inferInsert;
export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
export type NewFeedbackResponse = typeof feedbackResponses.$inferInsert;

// ─── Direct Messages ────────────────────────────────────────────────────────

export const dmConversations = pgTable(
  "dm_conversations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    participant1Id: uuid("participant1_id").notNull(),
    participant2Id: uuid("participant2_id").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    participant1Idx: index("dm_conversations_p1_idx").on(t.participant1Id),
    participant2Idx: index("dm_conversations_p2_idx").on(t.participant2Id),
    lastMessageIdx: index("dm_conversations_last_msg_idx").on(t.lastMessageAt),
  }),
);

export const dmMessages = pgTable(
  "dm_messages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => dmConversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    conversationIdx: index("dm_messages_conversation_idx").on(
      t.conversationId,
      t.createdAt,
    ),
    senderIdx: index("dm_messages_sender_idx").on(t.senderUserId),
  }),
);

export type DmConversation = typeof dmConversations.$inferSelect;
export type NewDmConversation = typeof dmConversations.$inferInsert;
export type DmMessage = typeof dmMessages.$inferSelect;
export type NewDmMessage = typeof dmMessages.$inferInsert;

// ─── Training & Quizzes ─────────────────────────────────────────────────────

export const trainingCourses = pgTable(
  "training_courses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    isPublished: boolean("is_published").notNull().default(false),
    // Minimum percent of quiz questions an employee must answer correctly to
    // pass the course. 0 means "no quiz gate" (any submission passes).
    passingScore: integer("passing_score").notNull().default(70),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    publishedIdx: index("training_courses_published_idx").on(t.isPublished),
  }),
);

export const trainingLessons = pgTable(
  "training_lessons",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    courseId: uuid("course_id")
      .notNull()
      .references(() => trainingCourses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    courseIdx: index("training_lessons_course_idx").on(t.courseId, t.sortOrder),
  }),
);

export const trainingQuizQuestions = pgTable(
  "training_quiz_questions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => trainingLessons.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    lessonIdx: index("training_quiz_questions_lesson_idx").on(
      t.lessonId,
      t.sortOrder,
    ),
  }),
);

export const trainingEnrollments = pgTable(
  "training_enrollments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    courseId: uuid("course_id")
      .notNull()
      .references(() => trainingCourses.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    // Lifecycle: assigned → in_progress → passed | failed. "failed" is a
    // transient state the employee can retry out of.
    status: text("status").notNull().default("in_progress"),
    // Assignment / "email request" metadata. assignedByUserId is the admin or
    // manager who requested the employee take this course.
    assignedByUserId: uuid("assigned_by_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    // Quiz attempt tracking.
    attemptCount: integer("attempt_count").notNull().default(0),
    bestScore: integer("best_score"),
    passedAt: timestamp("passed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    courseIdx: index("training_enrollments_course_idx").on(t.courseId),
    employeeIdx: index("training_enrollments_employee_idx").on(t.employeeId),
  }),
);

export const trainingQuizAnswers = pgTable(
  "training_quiz_answers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => trainingEnrollments.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => trainingQuizQuestions.id, { onDelete: "cascade" }),
    selectedIndex: integer("selected_index").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    enrollmentIdx: index("training_quiz_answers_enrollment_idx").on(
      t.enrollmentId,
    ),
    questionIdx: index("training_quiz_answers_question_idx").on(t.questionId),
  }),
);

export type TrainingCourse = typeof trainingCourses.$inferSelect;
export type NewTrainingCourse = typeof trainingCourses.$inferInsert;
export type TrainingLesson = typeof trainingLessons.$inferSelect;
export type NewTrainingLesson = typeof trainingLessons.$inferInsert;
export type TrainingQuizQuestion = typeof trainingQuizQuestions.$inferSelect;
export type NewTrainingQuizQuestion = typeof trainingQuizQuestions.$inferInsert;
export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type NewTrainingEnrollment = typeof trainingEnrollments.$inferInsert;
export type TrainingQuizAnswer = typeof trainingQuizAnswers.$inferSelect;
export type NewTrainingQuizAnswer = typeof trainingQuizAnswers.$inferInsert;

export type TrainingAttemptAnswer = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
};

export const trainingQuizAttempts = pgTable(
  "training_quiz_attempts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => trainingEnrollments.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => trainingCourses.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    score: integer("score").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    correctCount: integer("correct_count").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers")
      .$type<TrainingAttemptAnswer[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    enrollmentIdx: index("training_quiz_attempts_enrollment_idx").on(
      t.enrollmentId,
    ),
    courseIdx: index("training_quiz_attempts_course_idx").on(t.courseId),
  }),
);

export type TrainingQuizAttempt = typeof trainingQuizAttempts.$inferSelect;
export type NewTrainingQuizAttempt = typeof trainingQuizAttempts.$inferInsert;

// ─── Emergency Contacts ─────────────────────────────────────────────────────

export const emergencyContacts = pgTable(
  "emergency_contacts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: text("relationship").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employeeIdx: index("emergency_contacts_employee_idx").on(t.employeeId),
  }),
);

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert;