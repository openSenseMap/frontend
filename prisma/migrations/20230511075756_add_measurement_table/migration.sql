-- CreateTable
CREATE TABLE "Measurement" (
    "sensorId" TEXT NOT NULL,
    "time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION
);

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_sensorId_time_key" ON "Measurement"("sensorId", "time");
