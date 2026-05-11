CREATE TABLE IF NOT EXISTS "department_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_name" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"link_label" text DEFAULT 'Link' NOT NULL,
	"category" text,
	"document_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_resources_dept_kind_idx" ON "department_resources" USING btree ("department_name","kind","sort_order");