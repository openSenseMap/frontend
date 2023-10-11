-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "sensorWikiModel" TEXT;

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "sensorWikiPhenomenon" TEXT,
ADD COLUMN     "sensorWikiType" TEXT,
ADD COLUMN     "sensorWikiUnit" TEXT;
