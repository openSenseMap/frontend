/*
  Warnings:

  - You are about to drop the column `participantCount` on the `Campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "participantCount";

-- CreateTable
CREATE TABLE "_CampaignParticipant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignParticipant_AB_unique" ON "_CampaignParticipant"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignParticipant_B_index" ON "_CampaignParticipant"("B");

-- AddForeignKey
ALTER TABLE "_CampaignParticipant" ADD CONSTRAINT "_CampaignParticipant_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignParticipant" ADD CONSTRAINT "_CampaignParticipant_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
