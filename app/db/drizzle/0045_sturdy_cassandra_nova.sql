CREATE TABLE "campaign_bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_bookmark_user_campaign_unique" UNIQUE("user_id","campaign_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_bookmark" ADD CONSTRAINT "campaign_bookmark_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaign_bookmark" ADD CONSTRAINT "campaign_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "campaign_bookmark_campaign_id_idx" ON "campaign_bookmark" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_bookmark_user_id_idx" ON "campaign_bookmark" USING btree ("user_id");