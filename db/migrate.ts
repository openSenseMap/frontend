import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationConnection = postgres(process.env.DATABASE_URL!, { max: 1 });

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