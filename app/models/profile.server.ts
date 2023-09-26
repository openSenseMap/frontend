import type { Profile, User } from "@prisma/client";
import type { SelectProfile } from "db/schema";
import { drizzleClient, prisma } from "~/db.server";

export async function getProfileByUserId(id: SelectProfile["id"]) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, { eq }) => eq(profile.userId, id),
  });
}

export async function getProfileByUsername(
  username: SelectProfile["username"]
) {
  return drizzleClient.query.profile.findFirst({
    where: (profile, { eq }) => eq(profile.username, username),
    with: {
      user: {
        with: {
          devices: true,
        },
      },
    },
  });
}

export default function changeProfileVisibility(
  id: Profile["id"],
  visibility: Profile["public"]
) {
  return prisma.profile.update({
    where: { userId: id },
    data: { public: visibility },
  });
}

export async function createProfile(
  userId: User["id"],
  username: Profile["username"]
) {
  return prisma.profile.create({
    data: {
      username,
      public: false,
      userId,
    },
  });
}
