CREATE TABLE IF NOT EXISTS "survey_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"text_value" text,
	"rating_value" integer,
	"choice_values" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"responder_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"show_results_to_all" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_survey_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_answers_response_idx" ON "survey_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_answers_question_idx" ON "survey_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_questions_survey_idx" ON "survey_questions" USING btree ("survey_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_responses_survey_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_responses_responder_idx" ON "survey_responses" USING btree ("responder_id");