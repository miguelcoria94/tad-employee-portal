CREATE TABLE IF NOT EXISTS "feedback_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scope" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD COLUMN "request_type" text DEFAULT 'self' NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD COLUMN "questions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD COLUMN "answers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_templates_owner_idx" ON "feedback_templates" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_templates_scope_idx" ON "feedback_templates" USING btree ("scope");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_template_id_feedback_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."feedback_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "feedback_responses" DROP COLUMN IF EXISTS "question1";--> statement-breakpoint
ALTER TABLE "feedback_responses" DROP COLUMN IF EXISTS "question2";--> statement-breakpoint
ALTER TABLE "feedback_responses" DROP COLUMN IF EXISTS "question3";