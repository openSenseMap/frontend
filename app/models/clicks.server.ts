import type { MouseClick } from "@prisma/client";
import { prisma } from "~/db.server";

export function createClick({
  x,
  y,
  page,
  viewportWidth,
  viewportHeight,
}: Pick<MouseClick, "x" | "y" | "page" | "viewportWidth" | "viewportHeight">) {
  return prisma.mouseClick.create({
    data: {
      x,
      y,
      page,
      viewportWidth,
      viewportHeight,
    },
  });
}

export function getClicks(page: string) {
  return prisma.mouseClick.findMany({
    where: { page },
  });
}
