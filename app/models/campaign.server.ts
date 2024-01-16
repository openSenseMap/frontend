import { campaign, type Campaign } from "~/schema/campaign";
import type { User } from "~/schema";
import { generateSlug } from "~/lib/slug";
import { json } from "@remix-run/node";
import { drizzleClient } from "~/db.server";
import { drizzle } from "drizzle-orm/postgres-js";
import { count, eq } from "drizzle-orm";

export function getCampaign({ slug }: Pick<Campaign, "slug">, userId: string) {
  return drizzleClient.query.campaign.findFirst({
    // where: { slug },
    // include: {
    //   comments: {
    //     include: {
    //       owner: true,
    //     },
    //   },
    //   events: true,
    //   participants: true,
    //   bookmarks: {
    //     where: { userId: userId },
    //   },
    // },
    where: (campaign, {eq}) => eq(campaign.slug, slug),
    with: {
      posts: true
    }
  });
}

export async function getOwnCampaigns(userId: string) {
  return drizzleClient.query.campaign.findMany({
    where: (campaign, {eq}) => eq(campaign.ownerId, userId)
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
  const campaigns = await drizzleClient.query.campaign.findMany({
    // include: {
    //   participants: {
    //     select: {
    //       id: true,
    //     },
    //   },
    //   bookmarks: {
    //     where: {
    //       userId: userId,
    //     },
    //   },
    // },
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
    // ...options,
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
  return await drizzleClient.select({value: count()}).from(campaign);
}

export async function getFilteredCampaigns(title: string) {
  return drizzleClient.query.campaign.findMany({
    where: (campaign, {eq}) => eq(campaign.title, title)
  });
}

// export async function getBookmark({
//   id,
//   userId,
// }: Pick<Campaign, "id"> & { userId: User["id"] }) {
//   const bookmark = await prisma.campaignBookmark.findUnique({
//     where: {
//       userId_campaignId: { userId, campaignId: id },
//     },
//   });
//   return bookmark;
// }

// export async function getBookmarks({ userId }: { userId: User["id"] }) {
//   const bookmarks = await prisma.campaignBookmark.findMany({
//     where: {
//       userId: userId,
//     },
//   });
//   return bookmarks;
// }

// export async function bookmarkCampaign({
//   id,
//   userId,
// }: Pick<Campaign, "id"> & { userId: User["id"] }) {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   const campaign = await prisma.campaign.findUnique({
//     where: { id: id },
//     include: {
//       bookmarks: true,
//     },
//   });

//   if (!user || !campaign) {
//     return;
//   }

//   const isBookmarked = campaign.bookmarks.some((b) => b.userId === userId);

//   if (isBookmarked) {
//     const unbookmarked = await deleteCampaignBookmark({ id, userId });
//     if (unbookmarked) return json({ unbookmarked: true });
//     return unbookmarked;
//   } else {
//     const bookmark = await prisma.campaignBookmark.create({
//       data: {
//         userId: userId,
//         campaignId: id,
//       },
//     });
//     if (bookmark) {
//       return json({ bookmarked: true });
//     }
//     return bookmark;
//   }

  // const isBookmarked = user.bookmarkedCampaigns.some(
  //   (bookmark) => bookmark.id === id
  // );

  // if (isBookmarked) {
  //   const unbookmark = await prisma.user.update({
  //     where: { id: ownerId },
  //     data: { bookmarkedCampaigns: { disconnect: { id: id } } },
  //   });
  //   if (unbookmark) {
  //     return json({ unbookmarked: true });
  //   }
  //   return unbookmark;
  // } else {
  //   const bookmark = await prisma.user.update({
  //     where: { id: ownerId },
  //     data: { bookmarkedCampaigns: { connect: { id: id } } },
  //   });
  //   if (bookmark) {
  //     return json({ bookmarked: true });
  //   }
  //   return bookmark;
  // }
// }

export async function createCampaign({
  title,
  feature,
  ownerId,
  description,
  instructions,
  priority,
  countries,
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
  | "countries"
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
  return drizzleClient.insert(campaign).values({
      title: title,
      slug: slug,
      feature: feature === null ? {} : feature,
      description: description,
      instructions: instructions,
      priority: priority,
      countries: countries,
      minimumParticipants: minimumParticipants,
      startDate: startDate,
      endDate: endDate,
      createdAt: createdAt,
      updatedAt: updatedAt,
      phenomena: phenomena,
      exposure: exposure,
      hardwareAvailable: hardwareAvailable,
      centerpoint: centerpoint === null ? {} : centerpoint,
      ownerId: ownerId
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
    | "countries"
    | "updatedAt"
    | "phenomena"
    | "exposure"
    | "hardwareAvailable"
  >
) {
  return drizzleClient.update(campaign).set({
    title: update.title,

  }).where(eq(campaign.id, id));
}

// export async function updateCampaign(
//   campaignId: string,
//   participantId: string
// ) {
//   return prisma.campaign.update({
//     where: {
//       id: campaignId,
//     },
//     data: {
//       participants: {
//         connect: { id: participantId },
//       },
//       updatedAt: new Date(),
//     },
//   });
// }

// export function deleteCampaignBookmark({
//   id,
//   userId,
// }: Pick<Campaign, "id"> & { userId: User["id"] }) {
//   return prisma.campaignBookmark.delete({
//     where: { userId_campaignId: { userId, campaignId: id } },
//   });
// }

export function deleteCampaign({
  id,
  ownerId,
}: Pick<Campaign, "id"> & { ownerId: User["id"] }) {
  return drizzleClient.delete(campaign).where(eq(campaign.id, id))
}
