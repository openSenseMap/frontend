ALTER TABLE "device" ADD COLUMN "location_privacy" text DEFAULT 'masked' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_min_distance_meters" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_radius_meters" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_method" text DEFAULT 'stable-donut-displacement-v1' NOT NULL;
