ALTER TABLE "device" ADD COLUMN "orphaned_at" timestamp;--> statement-breakpoint
ALTER TABLE "sensor" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;