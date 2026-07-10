ALTER TABLE "device" ADD COLUMN "location_privacy" text DEFAULT 'exact' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_min_distance_meters" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_radius_meters" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_method" text DEFAULT 'stable-donut-displacement-v1' NOT NULL;