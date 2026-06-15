import 'maplibre-gl/dist/maplibre-gl.css'

import { Upload, RotateCcw } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import {
	Layer,
	Map,
	Marker,
	NavigationControl,
	Source,
	type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { type CampaignArea } from '~/lib/campaign'

type Coordinate = [number, number]

type CampaignAreaEditorProps = {
	defaultValue?: string
	error?: string
}

const polygonLayer = {
	id: 'campaign-area-fill',
	type: 'fill' as const,
	paint: {
		'fill-color': '#3d843f',
		'fill-opacity': 0.28,
	},
}

const polygonOutlineLayer = {
	id: 'campaign-area-outline',
	type: 'line' as const,
	paint: {
		'line-color': '#256d29',
		'line-width': 3,
	},
}

export function CampaignAreaEditor({
	defaultValue = '',
	error,
}: CampaignAreaEditorProps) {
	const { t } = useTranslation('campaigns')
	const [points, setPoints] = useState<Coordinate[]>([])
	const [areaValue, setAreaValue] = useState(defaultValue)
	const [geoJsonText, setGeoJsonText] = useState(defaultValue)
	const [localError, setLocalError] = useState<string | null>(null)

	const drawnArea = useMemo(() => {
		if (points.length < 3) return null
		return createAreaFromPoints(points)
	}, [points])

	const visibleArea = useMemo(() => {
		if (drawnArea) return drawnArea

		try {
			const parsed = JSON.parse(areaValue)
			if (parsed?.type === 'FeatureCollection') return parsed as CampaignArea
		} catch {
			return null
		}

		return null
	}, [areaValue, drawnArea])

	function handleMapClick(event: MapLayerMouseEvent) {
		const coordinate: Coordinate = [event.lngLat.lng, event.lngLat.lat]
		const nextPoints = [...points, coordinate]
		setPoints(nextPoints)

		if (nextPoints.length >= 3) {
			const area = createAreaFromPoints(nextPoints)
			const value = JSON.stringify(area)
			setAreaValue(value)
			setGeoJsonText(JSON.stringify(area, null, 2))
			setLocalError(null)
		}
	}

	function resetDrawing() {
		setPoints([])
		setAreaValue('')
		setGeoJsonText('')
		setLocalError(null)
	}

	function applyGeoJson(value: string) {
		setGeoJsonText(value)

		try {
			const parsed = JSON.parse(value)
			if (
				parsed?.type !== 'FeatureCollection' ||
				parsed.features?.[0]?.geometry?.type !== 'Polygon'
			) {
				throw new Error('Expected a FeatureCollection with a Polygon feature.')
			}

			setAreaValue(JSON.stringify(parsed))
			setPoints([])
			setLocalError(null)
		} catch (error) {
			setLocalError(
				error instanceof Error ? error.message : t('invalid_geojson'),
			)
		}
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === 'string') applyGeoJson(reader.result)
		}
		reader.readAsText(file)
	}

	return (
		<div className="space-y-4">
			<input type="hidden" name="areaGeojson" value={areaValue} />

			<div className="overflow-hidden rounded-lg border border-slate-200">
				<div className="h-[420px]">
					<Map
						initialViewState={{
							longitude: 7.628202,
							latitude: 51.961563,
							zoom: 4,
						}}
						mapStyle="https://tiles.openfreemap.org/styles/liberty"
						style={{ width: '100%', height: '100%' }}
						dragRotate={false}
						pitchWithRotate={false}
						onClick={handleMapClick}
					>
						<NavigationControl position="bottom-right" showCompass={false} />
						{points.map(([longitude, latitude], index) => (
							<Marker
								key={`${longitude}-${latitude}-${index}`}
								longitude={longitude}
								latitude={latitude}
							>
								<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-700 text-xs font-semibold text-white shadow">
									{index + 1}
								</div>
							</Marker>
						))}
						{visibleArea ? (
							<Source id="campaign-area" type="geojson" data={visibleArea}>
								<Layer {...polygonLayer} />
								<Layer {...polygonOutlineLayer} />
							</Source>
						) : null}
					</Map>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-4 py-3 text-sm text-slate-600">
					<span>{t('draw_area_hint')}</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={resetDrawing}
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						{t('reset_area')}
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="area-upload">{t('upload_geojson')}</Label>
				<div className="flex items-center gap-3">
					<InputFile id="area-upload" onChange={handleFileChange} />
					<Upload className="h-4 w-4 text-slate-500" />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="area-geojson">{t('paste_geojson')}</Label>
				<Textarea
					id="area-geojson"
					value={geoJsonText}
					onChange={(event) => applyGeoJson(event.currentTarget.value)}
					placeholder={t('geojson_placeholder')}
					className="min-h-36 font-mono text-xs"
				/>
			</div>

			{localError ? <p className="text-sm text-red-600">{localError}</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}
		</div>
	)
}

function createAreaFromPoints(points: Coordinate[]): CampaignArea {
	const first = points[0]
	const ring = [...points, first]

	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [ring],
				},
				properties: {},
			},
		],
	}
}

function InputFile({
	id,
	onChange,
}: {
	id: string
	onChange: React.ChangeEventHandler<HTMLInputElement>
}) {
	return (
		<input
			id={id}
			type="file"
			accept="application/geo+json,application/json,.geojson,.json"
			onChange={onChange}
			className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
		/>
	)
}
