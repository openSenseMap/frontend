DO $$ BEGIN
 CREATE TYPE "exposure" AS ENUM('indoor', 'outdoor', 'mobile', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "status" AS ENUM('active', 'inactive', 'old');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"useAuth" boolean,
	"exposure" "exposure",
	"status" "status" DEFAULT 'inactive',
	"public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "measurement" (
	"sensorId" text NOT NULL,
	"time" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"value" double precision,
	CONSTRAINT "measurement_sensorId_time_unique" UNIQUE("sensorId","time")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password" (
	"hash" text NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"public" boolean DEFAULT false,
	"user_id" text,
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_image" (
	"id" text PRIMARY KEY NOT NULL,
	"alt_text" text,
	"content_type" text NOT NULL,
	"blob" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"profile_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sensor" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"unit" text,
	"sensorType" text,
	"status" "status" DEFAULT 'inactive',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"device_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"role" text DEFAULT 'user',
	"language" text DEFAULT 'en_US',
	"emailIsConfirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password" ADD CONSTRAINT "password_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_image" ADD CONSTRAINT "profile_image_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
