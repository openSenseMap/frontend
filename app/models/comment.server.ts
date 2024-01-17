import { eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { type Comment, User, comment } from "~/schema";

export function createComment({
  content,
  campaignSlug,
  ownerId,
  postId
}: Pick<Comment, "content" | "campaignSlug" | "postId"> & {
  ownerId: User["id"];
}) {
  return drizzleClient.insert(comment).values({
      content: content,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: ownerId,
      campaignSlug: campaignSlug,
      postId: postId
      // campaign: {
      //   connect: {
      //     slug: campaignSlug,
      //   },
      // },
  }).returning()
}

export function deleteComment({ id }: Pick<Comment, "id">) {
  return drizzleClient.delete(comment).where(eq(comment.id, id))
}

export async function updateComment(commentId: string, content: string) {
  return drizzleClient.update(comment).set({
    content: content
  }).where(eq(comment.id, commentId));
}
