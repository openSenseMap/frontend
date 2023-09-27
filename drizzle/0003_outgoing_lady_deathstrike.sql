DO $$ BEGIN
 CREATE TYPE "model" AS ENUM('HOME_V2_LORA');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "model" "model";