import { ActionArgs, json } from "@remix-run/server-runtime";
import {
  createComment,
  deleteComment,
  updateComment,
} from "~/models/comment.server";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "~/models/campaign-events.server";
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

export async function createCampaignEvent({ request, params }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const startDate = new Date();
  const endDate = new Date();

  if (typeof title !== "string" || title.length === 0) {
    return json(
      { errors: { title: "title is required", body: null } },
      { status: 400 }
    );
  }
  if (typeof description !== "string" || description.length === 0) {
    return json(
      { errors: { description: "description is required", body: null } },
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
    const event = await createEvent({
      title,
      description,
      startDate,
      endDate,
      campaignSlug,
      ownerId,
    });
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

export async function deleteCampaignEvent({ request }: ActionArgs) {
  const formData = await request.formData();
  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || eventId.length === 0) {
    return json(
      { errors: { eventId: "eventId is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const eventToDelete = await deleteEvent({ id: eventId });
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function updateCampaignEvent({ request }: ActionArgs) {
  const formData = await request.formData();
  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || eventId.length === 0) {
    return json(
      { errors: { eventId: "eventId is required", body: null } },
      { status: 400 }
    );
  }

  const title = formData.get("title");
  if (typeof title !== "string" || title.length === 0) {
    return json(
      { errors: { title: "title is required", body: null } },
      { status: 400 }
    );
  }
  const description = formData.get("description");
  if (typeof description !== "string" || description.length === 0) {
    return json(
      { errors: { description: "description is required", body: null } },
      { status: 400 }
    );
  }
  const startDate = new Date();
  const endDate = new Date();
  try {
    const event = await updateEvent(
      eventId,
      title,
      description,
      startDate,
      endDate
    );
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}
