CREATE TYPE "public"."message_format" AS ENUM('json', 'csv', 'application/json', 'text/csv', 'debug_plain', '');--> statement-breakpoint
CREATE TYPE "public"."ttn_profile" AS ENUM('json', 'debug', 'sensebox/home', 'lora-serialization', 'cayenne-lpp');--> statement-breakpoint
CREATE TABLE "device_to_integrations" (
	"device_id" text NOT NULL,
	"mqtt_integration_id" text,
	"ttn_integration_id" text,
	CONSTRAINT "device_to_integrations_device_id_pk" PRIMARY KEY("device_id")
);
--> statement-breakpoint
CREATE TABLE "mqtt_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"url" text NOT NULL,
	"topic" text NOT NULL,
	"message_format" "message_format" DEFAULT 'json' NOT NULL,
	"decode_options" json,
	"connection_options" json,
	"device_id" text
);
--> statement-breakpoint
CREATE TABLE "ttn_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"dev_id" text NOT NULL,
	"app_id" text NOT NULL,
	"port" integer,
	"profile" "ttn_profile" DEFAULT 'json' NOT NULL,
	"decode_options" json DEFAULT '{}'::json,
	"device_id" text
);
--> statement-breakpoint
ALTER TABLE "device_to_integrations" ADD CONSTRAINT "device_to_integrations_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_to_integrations" ADD CONSTRAINT "device_to_integrations_mqtt_integration_id_mqtt_integration_id_fk" FOREIGN KEY ("mqtt_integration_id") REFERENCES "public"."mqtt_integration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_to_integrations" ADD CONSTRAINT "device_to_integrations_ttn_integration_id_ttn_integration_id_fk" FOREIGN KEY ("ttn_integration_id") REFERENCES "public"."ttn_integration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mqtt_integration" ADD CONSTRAINT "mqtt_integration_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ttn_integration" ADD CONSTRAINT "ttn_integration_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;