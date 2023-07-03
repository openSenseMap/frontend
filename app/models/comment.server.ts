import type { User, Comment } from "@prisma/client";
import { prisma } from "~/db.server";

export function createComment({
  content,
  campaignSlug,
  ownerId,
}: Pick<Comment, "content" | "campaignSlug"> & {
  ownerId: User["id"];
}) {
  return prisma.comment.create({
    data: {
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {
        connect: {
          id: ownerId,
        },
      },
      campaign: {
        connect: {
          slug: campaignSlug,
        },
      },
    },
  });
}

export function deleteComment({ id }: Pick<Comment, "id">) {
  return prisma.comment.deleteMany({
    where: { id },
  });
}
