/*
  Warnings:

  - You are about to drop the column `requiredParticipants` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `requiredSensors` on the `Campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "requiredParticipants",
DROP COLUMN "requiredSensors",
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "minimumParticipants" INTEGER;

-- CreateTable
CREATE TABLE "_CampaignToDevice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignToDevice_AB_unique" ON "_CampaignToDevice"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignToDevice_B_index" ON "_CampaignToDevice"("B");

-- AddForeignKey
ALTER TABLE "_CampaignToDevice" ADD CONSTRAINT "_CampaignToDevice_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToDevice" ADD CONSTRAINT "_CampaignToDevice_B_fkey" FOREIGN KEY ("B") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
