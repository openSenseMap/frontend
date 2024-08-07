import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { envDBSchema } from "./env-schema";

const migrationConnection = postgres(envDBSchema.DATABASE_URL, {
  max: 1,
  ssl: envDBSchema.PG_CLIENT_SSL === "true" ? true : false,
});

async function main() {
  console.log("Migrations started...");
  await migrate(drizzle(migrationConnection), {
    migrationsFolder: "./drizzle",
  });
  await migrationConnection.end();
  console.log("Migrations finished");
  process.exit(0);
}

// 🔥 Run migrations
main().catch((err) => {
  console.error(err);
  process.exit(0);
});
