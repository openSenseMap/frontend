import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  createComment,
  deleteComment,
  updateComment,
} from "~/models/comment.server";
import { requireUserId } from "~/session.server";

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
  const formData = await request.formData();
  const content = formData.get("comment");
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
  try {
    const comment = await createComment({ content, campaignSlug, ownerId });
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
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
