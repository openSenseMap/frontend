/*
  Warnings:

  - You are about to drop the `_UserBookmarkedCampaigns` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserBookmarkedCampaigns" DROP CONSTRAINT "_UserBookmarkedCampaigns_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserBookmarkedCampaigns" DROP CONSTRAINT "_UserBookmarkedCampaigns_B_fkey";

-- DropTable
DROP TABLE "_UserBookmarkedCampaigns";

-- CreateTable
CREATE TABLE "CampaignBookmark" (
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBookmark_userId_campaignId_key" ON "CampaignBookmark"("userId", "campaignId");

-- AddForeignKey
ALTER TABLE "CampaignBookmark" ADD CONSTRAINT "CampaignBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBookmark" ADD CONSTRAINT "CampaignBookmark_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
