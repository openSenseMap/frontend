CREATE TABLE "tos_user_state" (
	"user_id" text NOT NULL,
	"tos_version_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grace_until" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "tos_user_state_user_id_tos_version_id_pk" PRIMARY KEY("user_id","tos_version_id")
);
--> statement-breakpoint
DROP TABLE "tos_acceptance" CASCADE;--> statement-breakpoint
ALTER TABLE "tos_version" ADD COLUMN "grace_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "tos_user_state" ADD CONSTRAINT "tos_user_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tos_user_state" ADD CONSTRAINT "tos_user_state_tos_version_id_tos_version_id_fk" FOREIGN KEY ("tos_version_id") REFERENCES "public"."tos_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tos_user_state_user_idx" ON "tos_user_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tos_user_state_grace_until_idx" ON "tos_user_state" USING btree ("grace_until");