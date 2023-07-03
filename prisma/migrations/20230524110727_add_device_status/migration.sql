-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'OLD');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'INACTIVE';
