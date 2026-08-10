CREATE TABLE "sensor_wiki_alias" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"sensor_wiki_phenomenon" text NOT NULL,
	"sensor_wiki_unit" text,
	"title" text NOT NULL,
	"unit" text,
	"title_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"unit_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sensor_type_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sensor_wiki_alias_key_unique" ON "sensor_wiki_alias" USING btree ("key");--> statement-breakpoint
CREATE INDEX "sensor_wiki_alias_phenomenon_idx" ON "sensor_wiki_alias" USING btree ("sensor_wiki_phenomenon");