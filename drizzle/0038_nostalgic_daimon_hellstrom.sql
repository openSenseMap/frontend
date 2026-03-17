DROP INDEX "action_token_user_purpose_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "action_token_user_purpose_uq" ON "action_token" USING btree ("user_id","purpose");