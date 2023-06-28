import type { Profile, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getProfileByUserId(id: Profile["id"]) {
  return prisma.profile.findUnique({ where: { userId: id } });
}

export async function getProfileByUsername(username: Profile["username"]) {
  return prisma.profile.findUnique({
    where: { username },
    include: {
      user: {
        include: {
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
      public: true,
      userId,
    },
  });
}
