CREATE TABLE IF NOT EXISTS "department_managers" (
	"department_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "department_managers_department_id_user_id_pk" PRIMARY KEY("department_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "department_managers" ADD CONSTRAINT "department_managers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_managers_user_idx" ON "department_managers" USING btree ("user_id");