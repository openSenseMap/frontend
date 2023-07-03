/*
  Warnings:

  - Added the required column `title` to the `CampaignEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CampaignEvent" ADD COLUMN     "title" TEXT NOT NULL;
