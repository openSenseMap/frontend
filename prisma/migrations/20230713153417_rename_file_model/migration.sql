/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_fileId_fkey";

-- DropTable
DROP TABLE "File";

-- CreateTable
CREATE TABLE "BlobFile" (
    "id" TEXT NOT NULL,
    "blob" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlobFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlobFile_id_key" ON "BlobFile"("id");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "BlobFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
