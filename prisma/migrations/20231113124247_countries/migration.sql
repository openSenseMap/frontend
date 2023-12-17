/*
  Warnings:

  - You are about to drop the column `country` on the `Campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "country",
ADD COLUMN     "countries" TEXT[];
