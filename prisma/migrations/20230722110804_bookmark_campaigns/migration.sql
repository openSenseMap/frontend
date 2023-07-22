/*
  Warnings:

  - You are about to drop the column `grouptag` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `hardware_available` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `location_points` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `hardwareAvailable` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "grouptag",
DROP COLUMN "hardware_available",
DROP COLUMN "location_points",
ADD COLUMN     "hardwareAvailable" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "_UserBookmarkedCampaigns" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserBookmarkedCampaigns_AB_unique" ON "_UserBookmarkedCampaigns"("A", "B");

-- CreateIndex
CREATE INDEX "_UserBookmarkedCampaigns_B_index" ON "_UserBookmarkedCampaigns"("B");

-- AddForeignKey
ALTER TABLE "_UserBookmarkedCampaigns" ADD CONSTRAINT "_UserBookmarkedCampaigns_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBookmarkedCampaigns" ADD CONSTRAINT "_UserBookmarkedCampaigns_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
