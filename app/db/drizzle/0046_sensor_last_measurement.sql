CREATE TABLE IF NOT EXISTS "sensor_last_measurement" (
	"sensor_id" text PRIMARY KEY NOT NULL,
	"time" timestamp (3) with time zone NOT NULL,
	"value" double precision,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sensor_last_measurement" ADD CONSTRAINT "sensor_last_measurement_sensor_id_sensor_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensor"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
INSERT INTO "sensor_last_measurement" ("sensor_id", "time", "value")
SELECT
	s."id",
	(s."lastMeasurement"->>'createdAt')::timestamp (3) with time zone,
	(s."lastMeasurement"->>'value')::double precision
FROM "sensor" s
WHERE s."lastMeasurement" IS NOT NULL
	AND s."lastMeasurement"->>'createdAt' IS NOT NULL
	AND s."lastMeasurement"->>'value' IS NOT NULL
ON CONFLICT ("sensor_id") DO UPDATE SET
	"time" = excluded."time",
	"value" = excluded."value",
	"updated_at" = now()
WHERE "sensor_last_measurement"."time" <= excluded."time";
