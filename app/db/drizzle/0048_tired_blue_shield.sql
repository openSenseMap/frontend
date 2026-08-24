CREATE TABLE "rate_limit_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"tier" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"note" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
