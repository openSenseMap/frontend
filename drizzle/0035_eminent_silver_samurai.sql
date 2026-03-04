ALTER TABLE "tos_version" RENAME COLUMN "effective_at" TO "effective_from";--> statement-breakpoint
DROP INDEX "tos_version_effective_at_idx";--> statement-breakpoint
CREATE INDEX "tos_version_effective_from_idx" ON "tos_version" USING btree ("effective_from");