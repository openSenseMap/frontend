import type { User, Comment, Prisma } from "@prisma/client";
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

export async function updateComment(commentId: string, content: string) {
  return prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content: content,
      updatedAt: new Date(),
    },
  });
}
