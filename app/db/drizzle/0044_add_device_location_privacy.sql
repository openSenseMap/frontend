ALTER TABLE "device" ADD COLUMN "location_privacy" text DEFAULT 'exact' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_radius_meters" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "location_privacy_method" text DEFAULT 'deterministic-jitter-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_location_privacy_check" CHECK ("location_privacy" IN ('exact', 'masked'));--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_location_privacy_radius_check" CHECK ("location_privacy_radius_meters" IN (250, 500, 1000, 5000));--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_location_privacy_method_check" CHECK ("location_privacy_method" = 'deterministic-jitter-v1');
