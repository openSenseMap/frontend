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
	| 'consent_required'
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

export function calculateDeviceHeightAboveSeaLevel(
	terrainElevation: number | null | undefined,
	heightAboveGround: number | null | undefined,
) {
	if (terrainElevation == null || heightAboveGround == null) return null

	return calculateHeightAboveSeaLevel(terrainElevation, heightAboveGround)
}
