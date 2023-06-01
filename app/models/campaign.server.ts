import type { Campaign, User, Prisma } from "@prisma/client";

import { prisma } from "~/db.server";

export function getCampaign({ id }: Pick<Campaign, "id">) {
  return prisma.campaign.findFirst({
    where: { id },
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

export function createCampaign({
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
  return prisma.campaign.create({
    data: {
      title,
      feature: feature === null ? {} : feature,
      description,
      priority,
      participantCount: 0,
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

export async function updateCampaign(
  id: string,
  options: Prisma.CampaignUpdateInput
) {
  return prisma.campaign.update({
    where: { id },
    data: options,
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
