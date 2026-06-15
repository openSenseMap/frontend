import 'maplibre-gl/dist/maplibre-gl.css'

import bbox from '@turf/bbox'
import { useMemo, useRef } from 'react'
import {
	Layer,
	Map,
	Marker,
	NavigationControl,
	Source,
	type LayerProps,
	type MapRef,
} from 'react-map-gl/maplibre'
import { type CampaignCoverage } from '~/lib/campaign-coverage'
import { type CampaignArea } from '~/lib/campaign'

type CampaignMapPreviewProps = {
	area: unknown
	coverage?: CampaignCoverage
}

const polygonLayer = {
	id: 'campaign-preview-fill',
	type: 'fill' as const,
	paint: {
		'fill-color': '#3d843f',
		'fill-opacity': 0.3,
	},
}

const polygonOutlineLayer = {
	id: 'campaign-preview-outline',
	type: 'line' as const,
	paint: {
		'line-color': '#256d29',
		'line-width': 3,
	},
}

const gridLayer: LayerProps = {
	id: 'campaign-coverage-grid-fill',
	type: 'fill' as const,
	paint: {
		'fill-color': [
			'match',
			['get', 'status'],
			'complete',
			'#3d843f',
			'partial',
			'#f4b740',
			'#e2e8f0',
		],
		'fill-opacity': 0.45,
	},
}

const gridOutlineLayer: LayerProps = {
	id: 'campaign-coverage-grid-outline',
	type: 'line' as const,
	paint: {
		'line-color': '#ffffff',
		'line-width': 1,
		'line-opacity': 0.8,
	},
}

export function CampaignMapPreview({
	area,
	coverage,
}: CampaignMapPreviewProps) {
	const mapRef = useRef<MapRef>(null)
	const campaignArea = area as CampaignArea

	const initialViewState = useMemo(() => {
		try {
			const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
				bbox(campaignArea)

			return {
				longitude: (minLongitude + maxLongitude) / 2,
				latitude: (minLatitude + maxLatitude) / 2,
				zoom: 7,
			}
		} catch {
			return {
				longitude: 7.628202,
				latitude: 51.961563,
				zoom: 4,
			}
		}
	}, [campaignArea])

	function fitBounds() {
		try {
			const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
				bbox(campaignArea)
			mapRef.current?.fitBounds(
				[
					[minLongitude, minLatitude],
					[maxLongitude, maxLatitude],
				],
				{ padding: 48, duration: 0 },
			)
		} catch {
			// Keep initial view if the stored area cannot be bounded.
		}
	}

	return (
		<div className="h-[420px] overflow-hidden rounded-lg border border-slate-200">
			<Map
				ref={mapRef}
				initialViewState={initialViewState}
				mapStyle="https://tiles.openfreemap.org/styles/liberty"
				style={{ width: '100%', height: '100%' }}
				dragRotate={false}
				pitchWithRotate={false}
				onLoad={fitBounds}
			>
				<NavigationControl position="bottom-right" showCompass={false} />
				{coverage ? (
					<Source
						id="campaign-coverage-grid"
						type="geojson"
						data={coverage.grid}
					>
						<Layer {...gridLayer} />
						<Layer {...gridOutlineLayer} />
					</Source>
				) : null}
				<Source id="campaign-preview-area" type="geojson" data={campaignArea}>
					<Layer {...polygonLayer} />
					<Layer {...polygonOutlineLayer} />
				</Source>
				{coverage?.points.map((point) => (
					<Marker
						key={point.deviceId}
						longitude={point.longitude}
						latitude={point.latitude}
					>
						<div
							title={`${point.deviceName}: ${point.measurementCount}`}
							className="h-3 w-3 rounded-full border-2 border-white bg-slate-950 shadow"
						/>
					</Marker>
				))}
			</Map>
		</div>
	)
}
