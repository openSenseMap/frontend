ALTER TABLE "tos_acceptance" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tos_version" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tos_acceptance" CASCADE;--> statement-breakpoint
DROP TABLE "tos_version" CASCADE;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;