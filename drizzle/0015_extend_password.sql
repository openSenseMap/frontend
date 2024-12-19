ALTER TABLE "password" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "password" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;