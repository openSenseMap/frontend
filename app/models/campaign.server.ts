import type { Campaign, User, Prisma } from "@prisma/client";
import { generateSlug } from "~/lib/slug";
import { prisma } from "~/db.server";

export function getCampaign({ slug }: Pick<Campaign, "slug">) {
  return prisma.campaign.findFirst({
    where: { slug },
    include: {
      comments: {
        include: {
          owner: true,
        },
      },
      events: true,
    },
  });
}

export async function getOwnCampaigns(userId: string) {
  return await prisma.campaign.findMany({
    where: {
      ownerId: userId,
    },
  });
}

export async function getCampaigns() {
  return await prisma.campaign.findMany({});
}

export async function getFilteredCampaigns(title: string) {
  return prisma.campaign.findMany({
    where: { title },
  });
}

export async function createCampaign({
  title,
  feature,
  ownerId,
  description,
  priority,
  country,
  requiredSensors,
  requiredParticipants,
  startDate,
  endDate,
  createdAt,
  updatedAt,
  phenomena,
  exposure,
  hardware_available,
  centerpoint,
}: Pick<
  Campaign,
  | "title"
  | "slug"
  | "feature"
  | "description"
  | "priority"
  | "country"
  | "requiredSensors"
  | "requiredParticipants"
  | "startDate"
  | "endDate"
  | "createdAt"
  | "updatedAt"
  | "phenomena"
  | "exposure"
  | "hardware_available"
  | "centerpoint"
> & {
  ownerId: User["id"];
}) {
  const slug = await generateSlug(title);
  return prisma.campaign.create({
    data: {
      title,
      slug,
      feature: feature === null ? {} : feature,
      description,
      priority,
      // participantCount: 0,
      country,
      requiredSensors,
      requiredParticipants,
      startDate,
      endDate,
      createdAt,
      updatedAt,
      phenomena,
      exposure,
      hardware_available,
      centerpoint: centerpoint === null ? {} : centerpoint,
      owner: {
        connect: {
          id: ownerId,
        },
      },
    },
  });
}

// export async function updateCampaign(
//   id: string,
//   options: Prisma.CampaignUpdateInput
// ) {
//   return prisma.campaign.update({
//     where: { id },
//     data: options,
//   });
// }

export async function updateCampaign(
  campaignId: string,
  participantId: string
) {
  return prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      participants: {
        connect: { id: participantId },
      },
      updatedAt: new Date(),
    },
  });
}

export function deleteCampaign({
  id,
  ownerId,
}: Pick<Campaign, "id"> & { ownerId: User["id"] }) {
  return prisma.campaign.deleteMany({
    where: { id, ownerId },
  });
}
