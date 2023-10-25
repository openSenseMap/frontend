ALTER TABLE "device" ADD COLUMN "sensorWikiModel" text;--> statement-breakpoint
ALTER TABLE "sensor" ADD COLUMN "sensorWikiType" text;--> statement-breakpoint
ALTER TABLE "sensor" ADD COLUMN "sensorWikiPhenomenon" text;--> statement-breakpoint
ALTER TABLE "sensor" ADD COLUMN "sensorWikiUnit" text;