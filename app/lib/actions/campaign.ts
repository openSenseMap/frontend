import { requireUserId, requireUser } from "~/session.server";
import {
  // updateCampaign,
  deleteCampaign,
  update,
  // bookmarkCampaign,
} from "~/models/campaign.server";
import { redirect } from "@remix-run/server-runtime";
import type { Exposure, Priority } from "@prisma/client";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { campaignUpdateSchema } from "../validations/campaign";
import {
  campaignCancelled,
  triggerNotificationNewParticipant,
} from "~/novu.server";

export async function participate({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const user = await requireUser(request);
  const formData = await request.formData();
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return json(
      { errors: { campaignId: "campaignId is required", body: null } },
      { status: 400 }
    );
  }
  const campaignTitle = formData.get("title");
  if (typeof campaignTitle !== "string" || campaignTitle.length === 0) {
    return json(
      { errors: { campaignTitle: "campaignTitle is required", body: null } },
      { status: 400 }
    );
  }
  const campaignOwner = formData.get("owner");
  if (typeof campaignOwner !== "string" || campaignOwner.length === 0) {
    return json(
      { errors: { campaignOwner: "campaignOwner is required", body: null } },
      { status: 400 }
    );
  }
  // const email = formData.get("email");
  // const hardware = formData.get("hardware");
  // if (typeof email !== "string" || email.length === 0) {
  //   return json(
  //     { errors: { email: "email is required", body: null } },
  //     { status: 400 }
  //   );
  // }
  try {
    // const updated = await updateCampaign(campaignId, ownerId);
    console.log(campaignOwner);
    await triggerNotificationNewParticipant(
      campaignOwner,
      user.email,
      user.name,
      campaignTitle
    );
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

interface PhenomenaState {
  [phenomena: string]: boolean;
}

type PriorityType = keyof typeof Priority;
type ExposureType = keyof typeof Exposure;

export async function messageAllUsers({ request }: ActionArgs) {
  const formData = await request.formData();
  const message = formData.get("messageForAll");
  console.log(message);
  return json({ message });
}

export async function updateCampaignAction({ request }: ActionArgs) {
  const formData = await request.formData();
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return json(
      { errors: { campaignId: "campaignId is required", body: null } },
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
  const phenomenaString = formData.get("phenomena");
  let phenomenaState: PhenomenaState = {};
  if (typeof phenomenaString === "string") {
    phenomenaState = JSON.parse(phenomenaString);
  }
  const phenomena = Object.keys(phenomenaState).filter(
    (key) => phenomenaState[key]
  );

  const priority = formData.get("priority") as PriorityType;
  const begin = formData.get("startDate");
  const startDate =
    begin && typeof begin === "string" ? new Date(begin) : new Date();
  const end = formData.get("endDate");
  const endDate = end && typeof end === "string" ? new Date(end) : new Date();
  const location = formData.get("countries");
  let countries: string[] = ['dz']
  const minimumParticipants = formData.get("minimumParticipants");
  const minParticipants = parseInt(minimumParticipants);
  const updatedAt = new Date();
  const exposure = formData.get("exposure") as ExposureType;
  const hardwareAvailable =
    formData.get("hardware_available") === "on" ? true : false;
  console.log(
    campaignId,
    title,
    // description,
    phenomena,
    priority,
    startDate,
    endDate,
    countries,
    exposure,
    hardwareAvailable
  );
  try {
    const updatedCampaign = campaignUpdateSchema.parse({
      title: title,
      description: description,
      priority: priority,
      country: countries,
      phenomena: phenomena,
      startDate: startDate,
      endDate: endDate,
      minimumParticipants: minParticipants,
      updatedAt: updatedAt,
      exposure: exposure,
      hardwareAvailable: hardwareAvailable,
    });
    const updated = await update(campaignId, updatedCampaign);
    // console.log(updated);
    return redirect("../explore");
    // return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function deleteCampaignAction({ request }: ActionArgs) {
  const formData = await request.formData();
  const ownerId = await requireUserId(request);
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return json(
      { errors: { campaignId: "campaignId is required", body: null } },
      { status: 400 }
    );
  }
  const campaignTitle = formData.get("title");
  if (typeof campaignTitle !== "string" || campaignTitle.length === 0) {
    return json(
      { errors: { campaignTitle: "campaignTitle is required", body: null } },
      { status: 400 }
    );
  }
  let participants = formData.get("participants");
  if (typeof participants !== "string" || participants.length === 0) {
    return json(
      { errors: { participants: "participants is required", body: null } },
      { status: 400 }
    );
  }
  participants = JSON.parse(participants);
  try {
    const deleted = await deleteCampaign({ id: campaignId, ownerId });
    if (Array.isArray(participants)) {
      participants.map((p) => campaignCancelled(p.id, campaignTitle));
    }
    return redirect("../explore");
    // return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function bookmark({ request }: ActionArgs) {
  const formData = await request.formData();
  const userId = await requireUserId(request);
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return json(
      { errors: { campaignId: "campaignId is required", body: null } },
      { status: 400 }
    );
  }
  try {
    // const bookmarked = await bookmarkCampaign({ id: campaignId, userId });
    // return bookmarked;
    return null
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}
