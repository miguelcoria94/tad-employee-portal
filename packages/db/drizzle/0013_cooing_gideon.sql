CREATE TABLE IF NOT EXISTS "update_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"update_id" uuid NOT NULL,
	"author_user_id" uuid,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "update_comments" ADD CONSTRAINT "update_comments_update_id_company_updates_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."company_updates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "update_comments_update_idx" ON "update_comments" USING btree ("update_id","created_at");