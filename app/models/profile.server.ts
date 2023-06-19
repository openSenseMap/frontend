import { Profile, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getProfileById(id: Profile["id"]) {
  return prisma.profile.findUnique({ where: { userId: id } });
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
