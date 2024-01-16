import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  createComment,
  deleteComment,
  updateComment,
} from "~/models/comment.server";
import { createPost } from "~/models/post.server";
// import { getUserByName } from "~/models/user.server";
import { mentionedUser } from "~/novu.server";
import { User } from "~/schema";
import { requireUser, requireUserId } from "~/session.server";

export async function updateCommentAction({ request }: ActionArgs) {
  const formData = await request.formData();
  const content = formData.get("editComment");
  if (typeof content !== "string" || content.length === 0) {
    return json(
      { errors: { content: "content is required", body: null } },
      { status: 400 }
    );
  }
  const commentId = formData.get("commentId");
  if (typeof commentId !== "string" || commentId.length === 0) {
    return json(
      { errors: { commentId: "commentId is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const comment = await updateComment(commentId, content);
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function publishCommentAction({ request, params }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const username = (await requireUser(request)).name;
  const formData = await request.formData();
  const content = formData.get("comment");
  if (typeof content !== "string" || content.length === 0) {
    return json(
      { errors: { content: "content is required", body: null } },
      { status: 400 }
    );
  }
  let mentions = formData.get("mentions");
  if (typeof mentions !== "string" || mentions.length === 0) {
    return json(
      { errors: { mentions: "mentions is required", body: null } },
      { status: 400 }
    );
  }
  mentions = JSON.parse(mentions);
  const campaignSlug = params.slug;
  if (typeof campaignSlug !== "string" || campaignSlug.length === 0) {
    return json(
      { errors: { campaignSlug: "campaignSlug is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const comment = await createComment({ content, campaignSlug, ownerId });
    if (mentions) {
      // const user = await getUserByName(mentions);
      const user = {} as User
      if (user?.id) mentionedUser(user?.id, username, campaignSlug);
    }
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function publishPostAction({ request, params }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const title = formData.get("title")
  if (typeof title !== "string" || title.length === 0) {
    return json(
      { errors: { title: "title is required", body: null } },
      { status: 400 }
    );
  }
  const content = formData.get("content");
  if (typeof content !== "string" || content.length === 0) {
    return json(
      { errors: { content: "content is required", body: null } },
      { status: 400 }
    );
  }
  const campaignSlug = params.slug;
  if (typeof campaignSlug !== "string" || campaignSlug.length === 0) {
    return json(
      { errors: { campaignSlug: "campaignSlug is required", body: null } },
      { status: 400 }
    );
  }
  const post = await createPost({ campaignSlug, title, content, ownerId });
  return post
}

export async function deleteCommentAction({ request }: ActionArgs) {
  const formData = await request.formData();
  const commentId = formData.get("deleteComment");
  if (typeof commentId !== "string" || commentId.length === 0) {
    return json(
      { errors: { commentId: "commentId is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const commentToDelete = await deleteComment({ id: commentId });
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}
