CREATE TABLE IF NOT EXISTS "internal_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"location" text,
	"employment_type" text DEFAULT 'full_time' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"requirements" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"referrer_employee_id" uuid NOT NULL,
	"candidate_name" text NOT NULL,
	"candidate_email" text NOT NULL,
	"candidate_linkedin" text,
	"note" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_referrals" ADD CONSTRAINT "job_referrals_job_id_internal_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."internal_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_referrals" ADD CONSTRAINT "job_referrals_referrer_employee_id_employees_id_fk" FOREIGN KEY ("referrer_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internal_jobs_published_idx" ON "internal_jobs" USING btree ("is_published","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internal_jobs_department_idx" ON "internal_jobs" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_referrals_job_idx" ON "job_referrals" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_referrals_referrer_idx" ON "job_referrals" USING btree ("referrer_employee_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_referrals_status_idx" ON "job_referrals" USING btree ("status","created_at");