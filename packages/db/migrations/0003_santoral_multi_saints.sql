ALTER TABLE "saint_feasts" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "saint_feasts" ADD COLUMN IF NOT EXISTS "display_priority" integer DEFAULT 100 NOT NULL;
--> statement-breakpoint
ALTER TABLE "saint_feasts" ADD COLUMN IF NOT EXISTS "source_name" text;
--> statement-breakpoint
ALTER TABLE "saint_feasts" ADD COLUMN IF NOT EXISTS "source_url" text;
--> statement-breakpoint
UPDATE "saint_feasts"
SET
  "source_name" = CASE
    WHEN "source_name" IS NULL AND "source" IS NOT NULL THEN "source"
    ELSE "source_name"
  END,
  "source_url" = CASE
    WHEN "source_url" IS NULL AND "source" ILIKE 'http%' THEN "source"
    ELSE "source_url"
  END;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saint_feasts_date_priority_idx" ON "saint_feasts" ("feast_month","feast_day","is_primary","display_priority");
