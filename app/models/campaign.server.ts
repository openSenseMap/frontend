import type { Campaign, User, Prisma } from "@prisma/client";
import { generateSlug } from "~/lib/slug";
import { prisma } from "~/db.server";

export function getCampaign({ slug }: Pick<Campaign, "slug">, userId: string) {
  return prisma.campaign.findFirst({
    where: { slug },
    include: {
      comments: {
        include: {
          owner: true,
        },
      },
      events: true,
      participants: true,
      bookmarkedByUsers: {
        where: { id: userId },
      },
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

export async function getCampaigns(options = {}, userId?: string) {
  return await prisma.campaign.findMany({
    include: {
      participants: true,
      bookmarkedByUsers: {
        where: { id: userId },
      },
    },
    orderBy: [
      {
        bookmarkedByUsers: {
          _count: "desc",
        },
      },
      {
        updatedAt: "desc",
      },
    ],
    ...options,
  });
}

export async function getCampaignCount() {
  return await prisma.campaign.count();
}

export async function getFilteredCampaigns(title: string) {
  return prisma.campaign.findMany({
    where: { title },
  });
}

export async function bookmarkCampaign({
  id,
  ownerId,
}: Pick<Campaign, "id"> & { ownerId: User["id"] }) {
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    include: { bookmarkedCampaigns: true },
  });

  if (!user) {
    return;
  }

  const isBookmarked = user.bookmarkedCampaigns.some(
    (bookmark) => bookmark.id === id
  );

  if (isBookmarked) {
    await prisma.user.update({
      where: { id: ownerId },
      data: { bookmarkedCampaigns: { disconnect: { id: id } } },
    });
  } else {
    await prisma.user.update({
      where: { id: ownerId },
      data: { bookmarkedCampaigns: { connect: { id: id } } },
    });
  }
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
  hardwareAvailable,
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
  | "hardwareAvailable"
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
      hardwareAvailable,
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

export async function update(
  id: string,
  update: Pick<
    Campaign,
    | "title"
    | "description"
    | "priority"
    | "startDate"
    | "endDate"
    | "country"
    | "updatedAt"
    | "phenomena"
    | "exposure"
    | "hardwareAvailable"
  >
) {
  return prisma.campaign.update({
    data: update,
    where: {
      id: id,
    },
  });
}

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
