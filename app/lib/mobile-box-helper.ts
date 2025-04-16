import { getDistance } from 'geolib'

export interface LocationPoint {
	geometry: {
		x: number
		y: number
	}
	time: string
}

interface Trip {
	points: LocationPoint[]
	startTime: string
	endTime: string
}

export function categorizeIntoTrips(
	dataPoints: LocationPoint[],
	timeThreshold: number, // in seconds, time threshold for a new trip
): Trip[] {
	const trips: Trip[] = []
	let currentTrip: LocationPoint[] = []

	// Pre-sort data by time to ensure order
	dataPoints.sort(
		(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
	)

	for (let i = 1; i < dataPoints.length; i++) {
		const previousPoint = dataPoints[i - 1]!
		const currentPoint = dataPoints[i]!

		// Calculate time difference in seconds
		const timeDifference =
			(new Date(currentPoint.time).getTime() -
				new Date(previousPoint.time).getTime()) /
			1000

		// Check if a new trip should start based solely on the time difference
		const isNewTrip = timeDifference > timeThreshold

		if (isNewTrip) {
			if (currentTrip.length > 0) {
				trips.push({
					points: currentTrip,
					startTime: currentTrip[0]!.time,
					endTime: currentTrip.at(-1)!.time,
				})
			}
			currentTrip = []
		}
		currentTrip.push(currentPoint)
	}

	// Add the final trip
	if (currentTrip.length > 0) {
		trips.push({
			points: currentTrip,
			startTime: currentTrip[0]!.time,
			endTime: currentTrip.at(-1)!.time,
		})
	}

	// Optionally merge small trips (can be removed if not needed)
	return mergeSmallTrips(trips, timeThreshold)
}

function mergeSmallTrips(trips: Trip[], timeThreshold: number): Trip[] {
	if (trips.length <= 1) return trips

	const mergedTrips: Trip[] = []
	let currentTrip: Trip | null = null

	for (const trip of trips) {
		// If a trip is too small (in terms of points or duration), merge it with the current trip
		const tripDuration =
			(new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) /
			1000

		if (tripDuration >= timeThreshold) {
			if (currentTrip) {
				mergedTrips.push(currentTrip)
				currentTrip = null
			}
			mergedTrips.push(trip)
		} else {
			if (!currentTrip) {
				currentTrip = { points: [], startTime: '', endTime: '' }
			}
			currentTrip.points.push(...trip.points)

			// Recompute start and end times
			if (currentTrip.points.length > 0) {
				currentTrip.startTime = currentTrip.points[0]!.time
				currentTrip.endTime = currentTrip.points.at(-1)!.time
			}
		}
	}

	// Add any remaining combined trip
	if (currentTrip && currentTrip.points.length > 0) {
		mergedTrips.push(currentTrip)
	}

	// Post-process to sort all trips by time
	return mergedTrips.map((trip) => {
		trip.points.sort(
			(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
		)
		return trip
	})
}
