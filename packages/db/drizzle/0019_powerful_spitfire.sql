CREATE TABLE IF NOT EXISTS "dm_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant1_id" uuid NOT NULL,
	"participant2_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"subject_employee_id" uuid NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"respondent_user_id" uuid NOT NULL,
	"respondent_employee_id" uuid NOT NULL,
	"question1" text NOT NULL,
	"question2" text NOT NULL,
	"question3" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_index" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_conversation_id_dm_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."dm_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_subject_employee_id_employees_id_fk" FOREIGN KEY ("subject_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_request_id_feedback_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."feedback_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_respondent_employee_id_employees_id_fk" FOREIGN KEY ("respondent_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_quiz_answers" ADD CONSTRAINT "training_quiz_answers_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_quiz_answers" ADD CONSTRAINT "training_quiz_answers_question_id_training_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."training_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_quiz_questions" ADD CONSTRAINT "training_quiz_questions_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_conversations_p1_idx" ON "dm_conversations" USING btree ("participant1_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_conversations_p2_idx" ON "dm_conversations" USING btree ("participant2_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_conversations_last_msg_idx" ON "dm_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_messages_conversation_idx" ON "dm_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_messages_sender_idx" ON "dm_messages" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emergency_contacts_employee_idx" ON "emergency_contacts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_requests_requester_idx" ON "feedback_requests" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_requests_subject_idx" ON "feedback_requests" USING btree ("subject_employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_requests_status_idx" ON "feedback_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_responses_request_idx" ON "feedback_responses" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_responses_respondent_idx" ON "feedback_responses" USING btree ("respondent_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_responses_respondent_emp_idx" ON "feedback_responses" USING btree ("respondent_employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_courses_published_idx" ON "training_courses" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_enrollments_course_idx" ON "training_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_enrollments_employee_idx" ON "training_enrollments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_lessons_course_idx" ON "training_lessons" USING btree ("course_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_quiz_answers_enrollment_idx" ON "training_quiz_answers" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_quiz_answers_question_idx" ON "training_quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_quiz_questions_lesson_idx" ON "training_quiz_questions" USING btree ("lesson_id","sort_order");