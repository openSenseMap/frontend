/*
  Warnings:

  - A unique constraint covering the columns `[imageId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "imageId" TEXT;

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "blob" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "fileId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "File_id_key" ON "File"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileId_key" ON "Image"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_imageId_key" ON "Profile"("imageId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("fileId") ON DELETE SET NULL ON UPDATE CASCADE;
