import type { Profile, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getProfileByUserId(id: Profile["id"]) {
  return prisma.profile.findUnique({ where: { userId: id } });
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

export async function createProfile(userId: User["id"], name: Profile["name"]) {
  return prisma.profile.create({
    data: {
      name,
      public: true,
      userId,
    },
  });
}
