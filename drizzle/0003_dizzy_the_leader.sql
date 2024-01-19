CREATE TABLE IF NOT EXISTS "users_to_campaigns" (
	"user_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	CONSTRAINT "users_to_campaigns_user_id_campaign_id_pk" PRIMARY KEY("user_id","campaign_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_campaigns" ADD CONSTRAINT "users_to_campaigns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_campaigns" ADD CONSTRAINT "users_to_campaigns_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
