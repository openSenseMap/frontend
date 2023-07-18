import { requireUserId } from "~/session.server";
import {
  updateCampaign,
  deleteCampaign,
  update,
} from "~/models/campaign.server";
import { redirect } from "@remix-run/server-runtime";
import type { Exposure, Priority } from "@prisma/client";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

export async function participate({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return json(
      { errors: { campaignId: "campaignId is required", body: null } },
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
    const updated = await updateCampaign(campaignId, ownerId);
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
  const updatedAt = new Date();
  const exposure = formData.get("exposure") as ExposureType;
  const hardware_available =
    formData.get("hardware_available") === "on" ? true : false;
  console.log(
    campaignId,
    title,
    // description,
    phenomena,
    priority,
    startDate,
    endDate,
    exposure,
    hardware_available
  );
  try {
    const updated = await update(campaignId, {
      title,
      description,
      priority,
      startDate,
      endDate,
      updatedAt,
      phenomena,
      exposure,
      hardware_available,
    });
    console.log(updated);
    return redirect("../overview");
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
  try {
    const deleted = await deleteCampaign({ id: campaignId, ownerId });
    return redirect("../overview");
    // return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}
