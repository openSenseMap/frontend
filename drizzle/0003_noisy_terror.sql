CREATE TABLE IF NOT EXISTS "bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookmarks__user_id_device_id__idx" ON "bookmark" ("user_id","device_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
