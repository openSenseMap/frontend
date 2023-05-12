/*
  Warnings:

  - You are about to drop the column `location` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `country` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "location",
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "requiredParticipants" INTEGER,
ADD COLUMN     "requiredSensors" INTEGER;
