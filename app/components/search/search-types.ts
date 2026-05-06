export type SearchBBox = [[number, number], [number, number]]

export type DeviceSearchResult = {
	type: 'device'
	id: string
	displayName: string
	deviceId: string
	lng: number
	lat: number
}

export type LocationSearchResult = {
	type: 'location'
	id: string
	displayName: string
	center: [number, number]
	bbox?: SearchBBox
	locationKind?: string
}

export type SearchResult = DeviceSearchResult | LocationSearchResult

export type DeviceFeature = {
	type: 'Feature'
	properties: {
		id: string
		name: string
		longitude: number
		latitude: number
	}
}

export type DeviceFeatureCollection = {
	type: 'FeatureCollection'
	features: DeviceFeature[]
}
