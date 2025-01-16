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
  startTime: string;
  endTime: string;
}

export function categorizeIntoTrips(
  dataPoints: LocationPoint[],
  distanceThreshold: number, // in meters
  timeThreshold?: number, // in seconds, optional
): Trip[] {
  const trips: Trip[] = [];
  let currentTrip: LocationPoint[] = [];

  // Pre-sort data by time to ensure order
  dataPoints.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  for (let i = 1; i < dataPoints.length; i++) {
    const previousPoint = dataPoints[i - 1];
    const currentPoint = dataPoints[i];

    // Calculate distance
    const distance = getDistance(
      {
        latitude: previousPoint.geometry.x,
        longitude: previousPoint.geometry.y,
      },
      { latitude: currentPoint.geometry.x, longitude: currentPoint.geometry.y },
    );

    // Calculate time difference if applicable
    let timeDifference = 0;
    if (previousPoint.time && currentPoint.time) {
      timeDifference =
        (new Date(currentPoint.time).getTime() -
          new Date(previousPoint.time).getTime()) /
        1000;
    }

    // Check if a new trip should start
    const isNewTrip =
      distance > distanceThreshold ||
      (timeThreshold && timeDifference > timeThreshold);

    if (isNewTrip) {
      if (currentTrip.length > 0) {
        trips.push({
          points: currentTrip,
          startTime: currentTrip[0].time,
          endTime: currentTrip[currentTrip.length - 1].time,
        });
      }
      currentTrip = [];
    }
    currentTrip.push(currentPoint);
  }

  // Add the final trip
  if (currentTrip.length > 0) {
    trips.push({
      points: currentTrip,
      startTime: currentTrip[0].time,
      endTime: currentTrip[currentTrip.length - 1].time,
    });
  }

  // Merge small trips into larger ones
  return mergeSmallTrips(trips, distanceThreshold);
}

function mergeSmallTrips(trips: Trip[], _distanceThreshold: number): Trip[] {
  if (trips.length <= 1) return trips;

  // Combine small trips into adjacent larger trips
  const mergedTrips: Trip[] = [];
  let currentTrip: Trip | null = null;

  for (const trip of trips) {
    if (trip.points.length >= 50) {
      // If a small trip exists, merge it with the current large trip
      if (currentTrip) {
        mergedTrips.push(currentTrip);
        currentTrip = null;
      }
      mergedTrips.push(trip);
    } else {
      // Small trip: merge with the nearest valid trip
      if (!currentTrip) {
        currentTrip = { points: [], startTime: "", endTime: "" };
      }
      currentTrip.points.push(...trip.points);

      // Recompute start and end times
      if (currentTrip.points.length > 0) {
        currentTrip.startTime = currentTrip.points[0].time;
        currentTrip.endTime =
          currentTrip.points[currentTrip.points.length - 1].time;
      }
    }
  }

  // Add any remaining combined trip
  if (currentTrip && currentTrip.points.length > 0) {
    mergedTrips.push(currentTrip);
  }

  // Post-process to sort all trips by time
  return mergedTrips.map((trip) => {
    trip.points.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
    return trip;
  });
}
