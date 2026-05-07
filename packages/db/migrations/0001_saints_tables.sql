CREATE TABLE IF NOT EXISTS "saints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"romcal_key" text NOT NULL,
	"slug" text NOT NULL,
	"name_es" text NOT NULL,
	"name_original" text,
	"short_bio_es" text,
	"quote_es" text,
	"is_martyr" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT true NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saint_feasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saint_id" uuid NOT NULL,
	"feast_month" integer NOT NULL,
	"feast_day" integer NOT NULL,
	"feast_type" text NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"romcal_key" text,
	"romcal_name" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saints_romcal_key_unique" ON "saints" ("romcal_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saints_slug_unique" ON "saints" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saint_feasts_saint_id_idx" ON "saint_feasts" ("saint_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saint_feasts_month_day_idx" ON "saint_feasts" ("feast_month","feast_day");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saint_feasts_saint_date_unique" ON "saint_feasts" ("saint_id","feast_month","feast_day");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saint_feasts" ADD CONSTRAINT "saint_feasts_saint_id_saints_id_fk" FOREIGN KEY ("saint_id") REFERENCES "saints"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
