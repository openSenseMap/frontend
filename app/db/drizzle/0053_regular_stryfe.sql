DROP INDEX "elevation_consent_user_processor_idx";--> statement-breakpoint
CREATE INDEX "elevation_consent_user_idx" ON "elevation_consent" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "elevation_consent" DROP COLUMN "processor";