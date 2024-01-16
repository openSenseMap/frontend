import { eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { type Post, User, post } from "~/schema";

export function createPost({
    content,
    campaignSlug,
    ownerId,
    title,
  }: Pick<Post,  "title" | "content" | "campaignSlug"> & {
    ownerId: User["id"];
  }) {
    return drizzleClient.insert(post).values({
        content: content,
        userId: ownerId,
        campaignSlug: campaignSlug,
        title: title
    }).returning()
  }


export function deletePost({ id }: Pick<Post, "id">) {
  return drizzleClient.delete(post).where(eq(post.id, id))
}

export async function updatePost(postId: string, content: string) {
  return drizzleClient.update(post).set({
    content: content
  }).where(eq(post.id, postId));
}
