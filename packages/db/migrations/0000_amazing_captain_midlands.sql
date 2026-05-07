CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gospel_date" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prayer_intentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"text" text NOT NULL,
	"prayer_count" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prayer_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intention_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"last_active_date" text,
	"grace_days_used" integer DEFAULT 0 NOT NULL,
	"longest_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"donated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journal_entries_user_id_idx" ON "journal_entries" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journal_entries_gospel_date_idx" ON "journal_entries" ("gospel_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_user_id_gospel_date_unique" ON "journal_entries" ("user_id","gospel_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_intentions_user_id_idx" ON "prayer_intentions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_intentions_is_archived_idx" ON "prayer_intentions" ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_intentions_expires_at_idx" ON "prayer_intentions" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_intentions_feed_sort_idx" ON "prayer_intentions" ("is_archived","prayer_count","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_responses_intention_id_idx" ON "prayer_responses" ("intention_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_responses_user_id_idx" ON "prayer_responses" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prayer_responses_intention_user_unique" ON "prayer_responses" ("intention_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "streaks_user_id_idx" ON "streaks" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prayer_intentions" ADD CONSTRAINT "prayer_intentions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prayer_responses" ADD CONSTRAINT "prayer_responses_intention_id_prayer_intentions_id_fk" FOREIGN KEY ("intention_id") REFERENCES "prayer_intentions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prayer_responses" ADD CONSTRAINT "prayer_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
