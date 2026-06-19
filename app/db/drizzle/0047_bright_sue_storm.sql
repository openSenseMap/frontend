CREATE TABLE "campaign_template" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
	"category" text NOT NULL,
	"phenomena" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"grid_size" integer DEFAULT 6 NOT NULL,
	"min_devices_per_cell" integer DEFAULT 1 NOT NULL,
	"min_measurements_per_cell" integer DEFAULT 1 NOT NULL,
	"suggested_duration_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_template" ADD CONSTRAINT "campaign_template_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "campaign_template_owner_id_idx" ON "campaign_template" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "campaign_template_category_idx" ON "campaign_template" USING btree ("category");