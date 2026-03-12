DROP INDEX "tos_user_state_grace_until_idx";--> statement-breakpoint
ALTER TABLE "tos_version" ADD COLUMN "accept_by" timestamp with time zone NOT NULL;--> statement-breakpoint
CREATE INDEX "tos_version_accept_by_idx" ON "tos_version" USING btree ("accept_by");--> statement-breakpoint
ALTER TABLE "tos_user_state" DROP COLUMN "first_seen_at";--> statement-breakpoint
ALTER TABLE "tos_user_state" DROP COLUMN "grace_until";--> statement-breakpoint
ALTER TABLE "tos_version" DROP COLUMN "grace_days";