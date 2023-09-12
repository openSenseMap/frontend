import type { Campaign, User, Prisma } from "@prisma/client";
import { generateSlug } from "~/lib/slug";
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";

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

const priorityOrder = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function getCampaigns(
  options = {},
  userId?: string,
  sortBy?: string
) {
  const campaigns = await prisma.campaign.findMany({
    include: {
      participants: {
        select: {
          id: true,
        },
      },
      bookmarkedByUsers: {
        where: {
          id: userId,
        },
      },
    },
    // orderBy: [
    //   {
    //     bookmarkedByUsers: {
    //       _count: "desc",
    //     },
    //   },
    //   {
    //     updatedAt: "desc",
    //   },
    // ],
    ...options,
  });
  if (sortBy === "priority") {
    return campaigns
      .slice()
      .sort((campaignA: Campaign, campaignB: Campaign) => {
        const priorityA =
          priorityOrder[campaignA.priority as keyof typeof priorityOrder];
        const priorityB =
          priorityOrder[campaignB.priority as keyof typeof priorityOrder];

        return priorityA - priorityB;
      });
  }
  return campaigns;
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
    const unbookmark = await prisma.user.update({
      where: { id: ownerId },
      data: { bookmarkedCampaigns: { disconnect: { id: id } } },
    });
    if (unbookmark) {
      return json({ unbookmarked: true });
    }
    return unbookmark;
  } else {
    const bookmark = await prisma.user.update({
      where: { id: ownerId },
      data: { bookmarkedCampaigns: { connect: { id: id } } },
    });
    if (bookmark) {
      return json({ bookmarked: true });
    }
    return bookmark;
  }
}

export async function createCampaign({
  title,
  feature,
  ownerId,
  description,
  instructions,
  priority,
  country,
  minimumParticipants,
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
  | "instructions"
  | "priority"
  | "country"
  | "minimumParticipants"
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
      instructions,
      priority,
      country,
      minimumParticipants,
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
