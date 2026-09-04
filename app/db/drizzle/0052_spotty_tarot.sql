ALTER TABLE "device" RENAME COLUMN "height_above_sea_level" TO "terrain_elevation";--> statement-breakpoint
ALTER TABLE "device" RENAME COLUMN "height_above_sea_level_dataset" TO "terrain_elevation_dataset";--> statement-breakpoint
-- New feature rows store the calculated device height and can be decomposed by
-- subtracting height_above_ground. Legacy rows have no above-ground component;
-- treating it as zero preserves their existing absolute height.
UPDATE "device"
SET
	"terrain_elevation" = CASE
		WHEN "terrain_elevation" IS NULL THEN NULL
		ELSE "terrain_elevation" - COALESCE("height_above_ground", 0)
	END,
	"terrain_elevation_dataset" = CASE
		WHEN "terrain_elevation" IS NULL OR "height_above_ground" IS NULL THEN NULL
		ELSE "terrain_elevation_dataset"
	END,
	"height_above_ground" = CASE
		WHEN "terrain_elevation" IS NULL THEN "height_above_ground"
		ELSE COALESCE("height_above_ground", 0)
	END;
