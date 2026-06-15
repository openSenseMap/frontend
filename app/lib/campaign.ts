import { z } from 'zod'
import bbox from '@turf/bbox'
import {
	type Feature,
	type FeatureCollection,
	type GeoJsonProperties,
	type Polygon,
} from 'geojson'

export const campaignAreaFeatureSchema = z.object({
	type: z.literal('Feature'),
	geometry: z.object({
		type: z.literal('Polygon'),
		coordinates: z
			.array(
				z
					.array(z.tuple([z.number(), z.number()]))
					.min(4, 'A polygon needs at least three points.'),
			)
			.min(1),
	}),
	properties: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const campaignAreaSchema = z
	.object({
		type: z.literal('FeatureCollection'),
		features: z.array(campaignAreaFeatureSchema).min(1),
	})
	.refine(
		(area) => {
			const ring = area.features[0]?.geometry.coordinates[0]
			if (!ring || ring.length < 4) return false

			const first = ring[0]
			const last = ring[ring.length - 1]
			return first[0] === last[0] && first[1] === last[1]
		},
		{ message: 'The polygon must be closed.' },
	)

export type CampaignArea = FeatureCollection<Polygon, GeoJsonProperties>
export type CampaignAreaFeature = Feature<Polygon, GeoJsonProperties>

export function parseCampaignArea(value: string): CampaignArea {
	const parsed = JSON.parse(value)
	return campaignAreaSchema.parse(parsed) as CampaignArea
}

export function getCampaignCenterpoint(area: CampaignArea) {
	const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox(area)

	return {
		type: 'Feature' as const,
		geometry: {
			type: 'Point' as const,
			coordinates: [
				(minLongitude + maxLongitude) / 2,
				(minLatitude + maxLatitude) / 2,
			],
		},
		properties: {},
	}
}

export function slugifyCampaignTitle(title: string) {
	return title
		.trim()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
}

export function formatPhenomenonLabel(phenomenon: string) {
	return phenomenon
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
}
