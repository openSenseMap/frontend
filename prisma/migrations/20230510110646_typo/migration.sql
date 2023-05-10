/*
  Warnings:

  - You are about to drop the column `groupag` on the `Campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "groupag",
ADD COLUMN     "grouptag" TEXT[];
