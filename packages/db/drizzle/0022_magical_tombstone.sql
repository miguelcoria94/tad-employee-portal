CREATE TABLE IF NOT EXISTS "training_quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training_courses" ADD COLUMN "passing_score" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "status" text DEFAULT 'in_progress' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "assigned_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "best_score" integer;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD COLUMN "passed_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_quiz_attempts_enrollment_idx" ON "training_quiz_attempts" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_quiz_attempts_course_idx" ON "training_quiz_attempts" USING btree ("course_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_assigned_by_user_id_profiles_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
