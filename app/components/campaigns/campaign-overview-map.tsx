import 'maplibre-gl/dist/maplibre-gl.css'

import bbox from '@turf/bbox'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	Layer,
	Map,
	NavigationControl,
	Popup,
	Source,
	type LayerProps,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import {
	type Feature,
	type FeatureCollection,
	type GeoJsonProperties,
	type Polygon,
} from 'geojson'
import { Button } from '~/components/ui/button'
import { type CampaignArea } from '~/lib/campaign'

type CampaignOverviewMapProps = {
	campaigns: {
		slug: string
		title: string
		description: string
		area: unknown
	}[]
}

type CampaignAreaProperties = GeoJsonProperties & {
	slug: string
	title: string
	description: string
}

type CampaignAreaFeature = Feature<Polygon, CampaignAreaProperties>
type CampaignAreaCollection = FeatureCollection<Polygon, CampaignAreaProperties>

const areaLayer: LayerProps = {
	id: 'campaign-overview-area-fill',
	type: 'fill',
	paint: {
		'fill-color': '#3d843f',
		'fill-opacity': [
			'case',
			['boolean', ['feature-state', 'hover'], false],
			0.45,
			0.28,
		],
	},
}

const outlineLayer: LayerProps = {
	id: 'campaign-overview-area-outline',
	type: 'line',
	paint: {
		'line-color': '#256d29',
		'line-width': 2,
	},
}

export function CampaignOverviewMap({ campaigns }: CampaignOverviewMapProps) {
	const mapRef = useRef<MapRef>(null)
	const { t } = useTranslation('campaigns')
	const [selectedCampaign, setSelectedCampaign] = useState<{
		longitude: number
		latitude: number
		slug: string
		title: string
		description: string
	} | null>(null)

	const areas = useMemo(() => getCampaignAreas(campaigns), [campaigns])
	const initialViewState = useMemo(() => getInitialViewState(areas), [areas])

	function fitCampaignBounds() {
		if (areas.features.length === 0) return

		try {
			const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox(areas)
			mapRef.current?.fitBounds(
				[
					[minLongitude, minLatitude],
					[maxLongitude, maxLatitude],
				],
				{ padding: 40, duration: 0 },
			)
		} catch {
			// Keep the default view if a stored campaign area cannot be bounded.
		}
	}

	function handleMapClick(event: MapLayerMouseEvent) {
		const feature = event.features?.[0]
		if (!feature?.properties) {
			setSelectedCampaign(null)
			return
		}

		setSelectedCampaign({
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
			slug: String(feature.properties.slug),
			title: String(feature.properties.title),
			description: String(feature.properties.description),
		})
	}

	if (areas.features.length === 0) return null

	return (
		<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="border-b border-slate-200 p-4">
				<h2 className="text-lg font-semibold text-slate-950">
					{t('campaign_map_title')}
				</h2>
				<p className="mt-1 text-sm text-slate-600">
					{t('campaign_map_description')}
				</p>
			</div>
			<div className="h-[420px]">
				<Map
					ref={mapRef}
					initialViewState={initialViewState}
					interactiveLayerIds={[areaLayer.id!]}
					mapStyle="https://tiles.openfreemap.org/styles/liberty"
					style={{ width: '100%', height: '100%' }}
					dragRotate={false}
					pitchWithRotate={false}
					onClick={handleMapClick}
					onLoad={fitCampaignBounds}
				>
					<NavigationControl position="bottom-right" showCompass={false} />
					<Source id="campaign-overview-areas" type="geojson" data={areas}>
						<Layer {...areaLayer} />
						<Layer {...outlineLayer} />
					</Source>
					{selectedCampaign ? (
						<Popup
							longitude={selectedCampaign.longitude}
							latitude={selectedCampaign.latitude}
							anchor="bottom"
							closeButton
							onClose={() => setSelectedCampaign(null)}
						>
							<div className="max-w-56 space-y-2">
								<h3 className="font-semibold text-slate-950">
									{selectedCampaign.title}
								</h3>
								<p className="line-clamp-3 text-sm text-slate-600">
									{selectedCampaign.description}
								</p>
								<Button asChild size="sm" className="w-full">
									<Link to={`/campaigns/${selectedCampaign.slug}`}>
										{t('open_campaign')}
									</Link>
								</Button>
							</div>
						</Popup>
					) : null}
				</Map>
			</div>
		</section>
	)
}

function getCampaignAreas(
	campaigns: CampaignOverviewMapProps['campaigns'],
): CampaignAreaCollection {
	return {
		type: 'FeatureCollection',
		features: campaigns.flatMap((campaign) =>
			(campaign.area as CampaignArea).features.map((feature) => ({
				...feature,
				properties: {
					...(feature.properties ?? {}),
					slug: campaign.slug,
					title: campaign.title,
					description: campaign.description,
				},
			})),
		) as CampaignAreaFeature[],
	}
}

function getInitialViewState(areas: CampaignAreaCollection) {
	try {
		const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox(areas)

		return {
			longitude: (minLongitude + maxLongitude) / 2,
			latitude: (minLatitude + maxLatitude) / 2,
			zoom: 5,
		}
	} catch {
		return {
			longitude: 7.628202,
			latitude: 51.961563,
			zoom: 4,
		}
	}
}
