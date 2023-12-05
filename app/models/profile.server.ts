import type { User, Profile } from "~/schema";
import { profile } from "~/schema";
import { drizzleClient } from "~/db.server";
import { eq } from "drizzle-orm";


export async function getProfileByUserId(id: Profile["id"]) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, {eq}) => eq(profile.userId, id),
    with: {
      profileImage: true,
    },
  });
}

export async function getProfileByUsername(username: Profile["username"]) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, {eq}) => eq(profile.username, username),
    with: {
      user: {
        with: {
          devices: true
        }
      },
      profileImage: true
    }
  });
}

export default function changeProfileVisibility(
  id: Profile["id"],
  visibility: Profile["public"]
) {
  return drizzleClient.update(profile).set({public: visibility}).where(eq(profile.id, id))
  // return prisma.profile.update({
  //   where: { userId: id },
  //   data: { public: visibility },
  // });
}

export async function createProfile(
  userId: User["id"],
  username: Profile["username"]
) {
  return drizzleClient.insert(profile).values({
    username,
    public: false,
    userId
  });
}
