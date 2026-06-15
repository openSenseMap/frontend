ALTER TABLE "campaign" ADD COLUMN "grid_size" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "min_devices_per_cell" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "min_measurements_per_cell" integer DEFAULT 1 NOT NULL;