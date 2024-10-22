import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import invariant from "tiny-invariant";
import * as schema from "./schema";

let drizzleClient: PostgresJsDatabase<typeof schema>;

declare global {
  var __db__: PostgresJsDatabase<typeof schema>;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  drizzleClient = getClient();
} else {
  if (!global.__db__) {
    global.__db__ = getClient();
  }
  drizzleClient = global.__db__;
}

function getClient() {
  const { DATABASE_URL } = process.env;
  invariant(typeof DATABASE_URL === "string", "DATABASE_URL env var not set");

  const databaseUrl = new URL(DATABASE_URL);

  console.log(`🔌 setting up drizzle client to ${databaseUrl.host}`);

  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is. So if you need to change
  // something in this file, you'll need to manually restart the server.
  const queryClient = postgres(DATABASE_URL, {
    ssl: process.env.PG_CLIENT_SSL,
  });
  const client = drizzle(queryClient, { schema });

  return client;
}

export { drizzleClient };
