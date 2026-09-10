export const MOBILE_TRIP_GAP_SECONDS = 60
export const MOBILE_TRIP_LIMIT = 5

export interface LocationPoint {
	geometry: {
		x: number
		y: number
	}
	time: string
}

export interface Trip {
	points: LocationPoint[]
	startTime: string
	endTime: string
}

/**
 * Split location points into chronological trips. A gap greater than the
 * threshold starts a new trip.
 */
export function categorizeIntoTrips(
	dataPoints: LocationPoint[],
	timeThreshold = MOBILE_TRIP_GAP_SECONDS,
): Trip[] {
	if (dataPoints.length === 0) return []

	const sortedPoints = [...dataPoints].sort(
		(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
	)
	const trips: Trip[] = []
	let currentTrip: LocationPoint[] = [sortedPoints[0]]

	for (let i = 1; i < sortedPoints.length; i++) {
		const previousPoint = sortedPoints[i - 1]
		const currentPoint = sortedPoints[i]
		const timeDifference =
			(new Date(currentPoint.time).getTime() -
				new Date(previousPoint.time).getTime()) /
			1000

		if (timeDifference > timeThreshold) {
			trips.push(toTrip(currentTrip))
			currentTrip = [currentPoint]
		} else {
			currentTrip.push(currentPoint)
		}
	}

	trips.push(toTrip(currentTrip))
	return trips
}

/** Return the newest trips while preserving chronological display order. */
export function getLatestTrips(
	dataPoints: LocationPoint[],
	limit = MOBILE_TRIP_LIMIT,
	timeThreshold = MOBILE_TRIP_GAP_SECONDS,
): Trip[] {
	if (limit <= 0) return []
	return categorizeIntoTrips(dataPoints, timeThreshold).slice(-limit)
}

export function getLatestTripPoints(
	dataPoints: LocationPoint[],
	limit = MOBILE_TRIP_LIMIT,
	timeThreshold = MOBILE_TRIP_GAP_SECONDS,
): LocationPoint[] {
	return getLatestTrips(dataPoints, limit, timeThreshold).flatMap(
		(trip) => trip.points,
	)
}

function toTrip(points: LocationPoint[]): Trip {
	return {
		points,
		startTime: points[0].time,
		endTime: points[points.length - 1].time,
	}
}
