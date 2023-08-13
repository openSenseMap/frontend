import { prisma } from "~/db.server";

// This function retrieves measurements from the database based on the provided parameters.
export function getMeasurement(
  sensorId: string,
  aggregation: string,
  startDate?: Date,
  endDate?: Date
) {
  // If both start date and end date are provided, filter measurements within the specified time range.
  if (startDate && endDate) {
    // Check the aggregation level for measurements and fetch accordingly.
    if (aggregation === "15m") {
      return prisma.measurements_15min.findMany({
        where: {
          sensorId: sensorId,
          time: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          time: "desc",
        },
      });
    } else if (aggregation === "1d") {
      return prisma.measurements_1day.findMany({
        where: {
          sensorId: sensorId,
          time: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          time: "desc",
        },
      });
    }
    // If aggregation is not specified or different from "15m" and "1d", fetch default measurements.
    return prisma.measurement.findMany({
      where: {
        sensorId: sensorId,
        time: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        time: "desc",
      },
    });
  }

  // If only aggregation is provided, fetch measurements without considering time range.
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

  // If neither start date nor aggregation are specified, fetch default measurements with a limit of 5000.
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
