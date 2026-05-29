ALTER TABLE "profiles" ADD COLUMN "onboarding_steps" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_dismissed_at" timestamp with time zone;