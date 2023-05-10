/*
  Warnings:

  - You are about to drop the column `polygonDraw` on the `Campaign` table. All the data in the column will be lost.
  - The `phenomena` column on the `Campaign` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feature` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `priority` on the `Campaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `participantCount` on table `Campaign` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "polygonDraw",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "feature" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "Priority" NOT NULL,
ALTER COLUMN "participantCount" SET NOT NULL,
DROP COLUMN "phenomena",
ADD COLUMN     "phenomena" TEXT[];
