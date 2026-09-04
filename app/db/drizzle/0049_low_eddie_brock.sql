ALTER TABLE "device" RENAME COLUMN "height" TO "height_above_sea_level";--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "height_above_ground" double precision;