import { getDistance } from "geolib";

export interface LocationPoint {
  geometry: {
    x: number;
    y: number;
  };
  time: string;
}

interface Trip {
  points: LocationPoint[];
  startTime?: string;
  endTime?: string;
}

export function categorizeIntoTrips(
  dataPoints: LocationPoint[],
  distanceThreshold: number, // in meters
  timeThreshold?: number, // in seconds, optional
): Trip[] {
  const trips: Trip[] = [];
  let currentTrip: LocationPoint[] = [];

  // Sort data by time if available to ensure order
  const sortedDataPoints = [...dataPoints].sort((a, b) => {
    if (a.time && b.time) {
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    }
    return 0; // No sorting if times are not present
  });

  for (let i = 1; i < sortedDataPoints.length; i++) {
    const previousPoint = sortedDataPoints[i - 1];
    const currentPoint = sortedDataPoints[i];

    // Calculate distance in meters
    const distance = getDistance(
      {
        latitude: previousPoint.geometry.x,
        longitude: previousPoint.geometry.y,
      },
      { latitude: currentPoint.geometry.x, longitude: currentPoint.geometry.y },
    );

    // Calculate time difference in seconds if times are provided
    let timeDifference = 0;
    if (previousPoint.time && currentPoint.time) {
      timeDifference =
        (new Date(currentPoint.time).getTime() -
          new Date(previousPoint.time).getTime()) /
        1000;
    }

    // Check if a new trip should start based on distance and optionally time
    const isNewTrip =
      distance > distanceThreshold ||
      (timeThreshold && previousPoint.time && currentPoint.time
        ? timeDifference > timeThreshold
        : false);

    if (isNewTrip) {
      // Save the completed trip if it has points
      if (currentTrip.length > 0) {
        trips.push({
          points: currentTrip,
          startTime: currentTrip[0].time,
          endTime: currentTrip[currentTrip.length - 1].time,
        });
      }
      // Start a new trip
      currentTrip = [currentPoint];
    } else {
      currentTrip.push(currentPoint);
    }
  }

  // Add the last trip if it has points
  if (currentTrip.length > 0) {
    const lastPoint = currentTrip[currentTrip.length - 1];
    trips.push({
      points: currentTrip,
      startTime: currentTrip[0].time,
      endTime: lastPoint.time,
    });
  }

  return trips;
}
