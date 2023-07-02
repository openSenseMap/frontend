/*
  Warnings:

  - You are about to drop the column `campaignId` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `campaignSlug` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_campaignId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "campaignId",
ADD COLUMN     "campaignSlug" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_campaignSlug_fkey" FOREIGN KEY ("campaignSlug") REFERENCES "Campaign"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
