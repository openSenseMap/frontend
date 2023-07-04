import type { User, CampaignEvent } from "@prisma/client";
import { prisma } from "~/db.server";

export function createEvent({
  title,
  description,
  campaignSlug,
  startDate,
  endDate,
  ownerId,
}: Pick<
  CampaignEvent,
  "title" | "description" | "campaignSlug" | "startDate" | "endDate"
> & {
  ownerId: User["id"];
}) {
  return prisma.campaignEvent.create({
    data: {
      title,
      description,
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {
        connect: {
          id: ownerId,
        },
      },
      campaign: {
        connect: {
          slug: campaignSlug,
        },
      },
    },
  });
}

export function deleteEvent({ id }: Pick<CampaignEvent, "id">) {
  return prisma.campaignEvent.deleteMany({
    where: { id },
  });
}

export async function updateEvent(
  eventId: string,
  title?: string,
  description?: string,
  startDate?: Date,
  endDate?: Date
) {
  return prisma.campaignEvent.update({
    where: {
      id: eventId,
    },
    data: {
      title,
      description,
      startDate,
      endDate,
      updatedAt: new Date(),
    },
  });
}
