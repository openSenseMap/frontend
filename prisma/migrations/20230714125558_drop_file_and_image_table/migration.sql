/*
  Warnings:

  - You are about to drop the column `imageId` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_fileId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_imageId_fkey";

-- DropIndex
DROP INDEX "Profile_imageId_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "imageId";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Image";
