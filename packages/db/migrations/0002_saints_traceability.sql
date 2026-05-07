ALTER TABLE "saints" ADD COLUMN IF NOT EXISTS "source_name" text;
--> statement-breakpoint
ALTER TABLE "saints" ADD COLUMN IF NOT EXISTS "source_url" text;
--> statement-breakpoint
ALTER TABLE "saints" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "saints"
SET
  "source_name" = CASE
    WHEN "source" ILIKE 'http%' THEN 'Wikipedia'
    WHEN "source" IS NOT NULL THEN "source"
    ELSE "source_name"
  END,
  "source_url" = CASE
    WHEN "source" ILIKE 'http%' THEN "source"
    ELSE "source_url"
  END
WHERE "source_name" IS NULL OR "source_url" IS NULL;
--> statement-breakpoint
UPDATE "saints"
SET "source_name" = 'Romcal'
WHERE lower("source_name") = 'romcal';
--> statement-breakpoint
UPDATE "saints"
SET
  "source_name" = 'Wikipedia',
  "needs_review" = true,
  "reviewed_at" = null
WHERE "source_url" ILIKE '%wikipedia.org%';
