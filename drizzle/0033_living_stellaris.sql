CREATE TABLE "tos_acceptance" (
	"user_id" text NOT NULL,
	"tos_version_id" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tos_acceptance_user_id_tos_version_id_pk" PRIMARY KEY("user_id","tos_version_id")
);
--> statement-breakpoint
CREATE TABLE "tos_version" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tos_version_version_unique" UNIQUE("version")
);
--> statement-breakpoint
ALTER TABLE "tos_acceptance" ADD CONSTRAINT "tos_acceptance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tos_acceptance" ADD CONSTRAINT "tos_acceptance_tos_version_id_tos_version_id_fk" FOREIGN KEY ("tos_version_id") REFERENCES "public"."tos_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tos_acceptance_user_idx" ON "tos_acceptance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tos_version_effective_at_idx" ON "tos_version" USING btree ("effective_at");