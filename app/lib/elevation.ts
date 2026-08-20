export type TerrainElevationResult = {
	elevation: number
	dataset: string
	datum: string | null
	attribution: string | null
	latitude: number
	longitude: number
}

export type ElevationLookupErrorCode =
	| 'invalid_location'
	| 'unavailable'
	| 'rate_limited'
	| 'timeout'
	| 'upstream_error'
	| 'invalid_response'

export type ElevationResourceResponse =
	| {
			ok: true
			result: TerrainElevationResult
	  }
	| {
			ok: false
			error: ElevationLookupErrorCode
	  }

export function calculateHeightAboveSeaLevel(
	terrainElevation: number,
	heightAboveGround?: number | null,
) {
	return terrainElevation + (heightAboveGround ?? 0)
}
