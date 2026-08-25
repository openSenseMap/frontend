CREATE TABLE "altcha_challenge_redemption" (
	"signature" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "altcha_challenge_redemption_expires_at_idx" ON "altcha_challenge_redemption" USING btree ("expires_at");