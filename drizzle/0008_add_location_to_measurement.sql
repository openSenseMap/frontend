ALTER TABLE "measurement" ADD COLUMN "location" geometry(point);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "measurement_location_index" ON "measurement" USING gist ("location");