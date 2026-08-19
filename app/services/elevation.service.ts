/**
 * Fetch elevation data from OpenTopoData API for a given latitude and longitude
 * Uses EU-DEM dataset for Europe (25m resolution) with fallback to global SRTM dataset (30m resolution)
 * The API will automatically try datasets in order until a non-null elevation is found
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Promise with elevation in meters above sea level, or null if error
 */
export async function getElevation(
	latitude: number,
	longitude: number,
): Promise<number | null> {
	try {
		// Use multi-dataset query: EU-DEM first (Europe), then SRTM (global, latitudes -60 to 60)
		// The API will try each dataset in order until a non-null elevation is found
		const response = await fetch(
			`https://api.opentopodata.org/v1/eudem25m,srtm30m?locations=${latitude},${longitude}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			console.error(
				`OpenTopoData API error: ${response.status} ${response.statusText}`,
			)
			return null
		}

		const data = await response.json()

		if (data.results && data.results.length > 0) {
			const elevation = data.results[0].elevation
			if (typeof elevation === 'number' && !isNaN(elevation)) {
				return elevation
			}
		}

		console.error('Invalid elevation data format:', data)
		return null
	} catch (error) {
		console.error('Error fetching elevation data:', error)
		return null
	}
}

/**
 * Calculate the final height above sea level by adding height above ground to terrain elevation
 * @param terrainElevation - Elevation of the terrain in meters above sea level (null if not available)
 * @param heightAboveGround - Height above ground in meters (user input)
 * @returns Final height above sea level in meters, or null if terrain elevation is not available
 */
export function calculateFinalHeight(
	terrainElevation: number | null,
	heightAboveGround: number | undefined | null,
): number | null {
	if (terrainElevation === null) {
		// If we don't have terrain elevation, we can't calculate
		return null
	}

	if (heightAboveGround === undefined || heightAboveGround === null) {
		// If user didn't provide height above ground, use terrain elevation as the height
		return terrainElevation
	}

	// Add terrain elevation and height above ground
	return terrainElevation + heightAboveGround
}
