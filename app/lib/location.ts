/**
 * Checks whether the given longitude and latitude
 * are within the value range
 * @param lng Longitude
 * @param lat Latitude
 */
export const validLngLat = (lng: number, lat: number): boolean => {
	// the value range for lat is [-90, 90] and for longitude [-180, 180]
	return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
