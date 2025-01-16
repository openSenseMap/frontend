import { eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import  { type User, type Profile, profile  } from "~/schema";

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
  return drizzleClient.insert(profile).values({
    username,
    public: false,
    userId,
  });
}
