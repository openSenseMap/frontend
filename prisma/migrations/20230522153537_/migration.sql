/*
  Warnings:

  - You are about to drop the column `keywords` on the `Campaign` table. All the data in the column will be lost.
  - The `country` column on the `Campaign` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "keywords",
DROP COLUMN "country",
ADD COLUMN     "country" TEXT[];
