/*
  Warnings:

  - Added the required column `exposure` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hardware_available` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "exposure" "Exposure" NOT NULL,
ADD COLUMN     "groupag" TEXT[],
ADD COLUMN     "hardware_available" BOOLEAN NOT NULL,
ADD COLUMN     "location_points" JSONB;
