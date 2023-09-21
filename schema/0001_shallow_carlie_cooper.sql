ALTER TABLE "password" ALTER COLUMN "hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;