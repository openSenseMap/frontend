CREATE TABLE "campaign_update" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "discussion_url" text;--> statement-breakpoint
ALTER TABLE "campaign_update" ADD CONSTRAINT "campaign_update_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaign_update" ADD CONSTRAINT "campaign_update_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "campaign_update_campaign_id_idx" ON "campaign_update" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_update_author_id_idx" ON "campaign_update" USING btree ("author_id");