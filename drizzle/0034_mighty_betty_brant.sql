ALTER TABLE "user" ADD COLUMN "accepted_tos_version_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "accepted_tos_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_accepted_tos_version_id_tos_version_id_fk" FOREIGN KEY ("accepted_tos_version_id") REFERENCES "public"."tos_version"("id") ON DELETE no action ON UPDATE no action;