import { prisma } from "~/db.server";

export function getMeasurement(sensorId: string, aggregation: string) {
  if (aggregation === "15m") {
    return prisma.measurements_15min.findMany({
      where: {
        sensorId: sensorId,
      },
      orderBy: {
        time: "desc",
      },
    });
  } else if (aggregation === "1d") {
    return prisma.measurements_1day.findMany({
      where: {
        sensorId: sensorId,
      },
      orderBy: {
        time: "desc",
      },
    });
  }

  return prisma.measurement.findMany({
    take: 5000,
    where: {
      sensorId: sensorId,
    },
    orderBy: {
      time: "desc",
    },
  });
}