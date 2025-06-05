import { eq, type ExtractTablesWithRelations } from "drizzle-orm";
import { type PgTransaction } from "drizzle-orm/pg-core";
import { type PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { drizzleClient } from "~/db.server";
import { type User, type Profile, profile  } from "~/schema";
import type * as schema from "~/schema";

export async function getProfileByUserId(id: Profile["id"]) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, { eq }) => eq(profile.userId, id),
    with: {
      profileImage: true,
    },
  });
}

export async function getProfileByUsername(username: Profile["username"]) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, { eq }) => eq(profile.username, username),
    with: {
      user: {
        with: {
          devices: true,
        },
      },
      profileImage: true,
    },
  });
}

export async function updateProfile(
  id: Profile["id"],
  username: Profile["username"],
  visibility: Profile["public"],
) {
  try {
    const result = await drizzleClient
      .update(profile)
      .set({ username, public: visibility })
      .where(eq(profile.id, id));
    return result;
  } catch (error) {
    throw error;
  }
}

export async function createProfile(
  userId: User["id"],
  username: Profile["username"],
) {
  return drizzleClient.transaction(t => 
    createProfileWithTransaction(t, userId, username));
}

export async function createProfileWithTransaction(
  transaction: PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>,
  userId: User["id"],
  username: Profile["username"],
) {
  return transaction
    .insert(profile)
    .values({
      username,
      public: false,
      userId,
    });
}