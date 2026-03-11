CREATE TABLE IF NOT EXISTS "post" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(191) NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"campaignSlug" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "post_id" text;