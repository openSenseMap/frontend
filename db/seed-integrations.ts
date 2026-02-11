import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { integration } from "../app/schema/integration";
import { envDBSchema } from "./env-schema";

console.log(`🔌 setting up drizzle client to ${envDBSchema.DATABASE_URL}`);

const queryClient = postgres(envDBSchema.DATABASE_URL, {
  max: 1,
  ssl: envDBSchema.PG_CLIENT_SSL === "true" ? true : false,
});
const client = drizzle(queryClient);

async function seed() {
    await client.insert(integration).values([
  {
    name: 'MQTT',
    slug: 'mqtt',
    serviceUrl: process.env.MQTT_SERVICE_URL!,
    serviceKeyEnvVar: 'MQTT_SERVICE_KEY',
    schemaPath: '/integrations/schema/mqtt',
    icon: 'message-square-text',
    order: 1,
  },
  {
    name: 'The Things Network',
    slug: 'ttn',
    serviceUrl: process.env.TTN_SERVICE_URL!,
    serviceKeyEnvVar: 'TTN_SERVICE_KEY',
    schemaPath: '/integrations/schema/ttn',
    icon: 'antenna',
    order: 2,
  },
]);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await queryClient.end({ timeout: 5 });
  });
