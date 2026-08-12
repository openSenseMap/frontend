import { featureCollection, point } from '@turf/helpers'
import { type Point } from 'geojson'
import { type CircleLayerSpecification } from 'maplibre-gl'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { Layer, Popup, Source, useMap } from 'react-map-gl/maplibre'
import { HIGH_COLOR, LOW_COLOR, createPalette } from './color-palette'
import { type Sensor } from '~/db/schema'

interface CustomGeoJsonProperties {
	locationId: number
	value: number
	time: string
	color: string
}

export const HoveredPointContext = createContext<{
	hoveredPoint: number | null
	setHoveredPoint: (point: number | null) => void
}>({
	hoveredPoint: null,
	setHoveredPoint: () => {},
})

export default function MobileBoxLayer({
	sensor,
	minColor = LOW_COLOR,
	maxColor = HIGH_COLOR,
}: {
	sensor: Sensor
	minColor?: NonNullable<CircleLayerSpecification['paint']>['circle-color']
	maxColor?: NonNullable<CircleLayerSpecification['paint']>['circle-color']
}) {
	const { hoveredPoint, setHoveredPoint } = useContext(HoveredPointContext)
	const { osem: mapRef } = useMap()

	const sourceData = useMemo<GeoJSON.FeatureCollection | null>(() => {
		const sensorData = (sensor.data ?? []) as unknown as {
			value: number | string | null
			location: { x: number; y: number; id: number } | null
			time: Date | string | null
		}[]
		const mappableData = sensorData.filter(
			(measurement) =>
				measurement.location !== null &&
				measurement.value !== null &&
				Number.isFinite(Number(measurement.value)),
		)

		if (mappableData.length === 0) return null

		const minValue = Math.min(...mappableData.map((d) => Number(d.value)))
		const maxValue = Math.max(...mappableData.map((d) => Number(d.value)))
		const palette = createPalette(
			minValue,
			maxValue,
			minColor as string,
			maxColor as string,
		)

		const points = mappableData.map((measurement) =>
			point([measurement.location!.x, measurement.location!.y], {
				value: Number(measurement.value),
				time: measurement.time ? new Date(measurement.time).toISOString() : '',
				color: palette(Number(measurement.value)).hex(),
				locationId: measurement.location!.id,
			}),
		)

		return featureCollection<Point>(points)
	}, [maxColor, minColor, sensor.data])

	const hoveredFeature = useMemo(() => {
		if (!sourceData || hoveredPoint === null) return null

		return (
			sourceData.features.find(
				(feat) =>
					feat.geometry.type === 'Point' &&
					(feat.properties as CustomGeoJsonProperties | undefined)
						?.locationId === hoveredPoint,
			) ?? null
		)
	}, [hoveredPoint, sourceData])

	useEffect(() => {
		if (!mapRef) return

		const map = mapRef.getMap()

		const handleMouseMove = (e: any) => {
			if (!e.features || e.features.length === 0) return

			const feature = e.features[0]
			const { locationId } = feature.properties as CustomGeoJsonProperties
			setHoveredPoint(locationId)
		}

		const handleMouseLeave = () => {
			setHoveredPoint(null)
		}

		map.on('mousemove', 'box-layer-point', handleMouseMove)
		map.on('mouseleave', 'box-layer-point', handleMouseLeave)

		return () => {
			map.off('mousemove', 'box-layer-point', handleMouseMove)
			map.off('mouseleave', 'box-layer-point', handleMouseLeave)
		}
	}, [mapRef, setHoveredPoint])

	if (!sourceData) return null

	const popupCoordinates =
		hoveredFeature?.geometry.type === 'Point'
			? (hoveredFeature.geometry.coordinates as [number, number])
			: null

	const popupProps = hoveredFeature?.properties as
		| CustomGeoJsonProperties
		| undefined

	return (
		<>
			<Source id="box-source" type="geojson" data={sourceData}>
				<Layer
					id="box-layer-point"
					source="box-source"
					filter={['==', '$type', 'Point']}
					type="circle"
					paint={{
						'circle-color': ['get', 'color'],
						'circle-radius': 5,
					}}
				/>
				<Layer
					id="highlighted-layer"
					source="box-source"
					filter={['==', ['get', 'locationId'], hoveredPoint ?? -1]}
					type="circle"
					paint={{
						'circle-color': ['get', 'color'],
						'circle-radius': 8,
						'circle-opacity': 1,
					}}
					beforeId="box-layer-point"
				/>
			</Source>

			{popupCoordinates && popupProps ? (
				<Popup
					longitude={popupCoordinates[0]}
					latitude={popupCoordinates[1]}
					closeButton={false}
					closeOnClick={false}
					className="highlight-popup"
					anchor="bottom"
				>
					<div className="flex flex-col items-center justify-center">
						<strong>{sensor.title}</strong>
						<strong>
							{popupProps.value}
							{sensor.unit}
						</strong>
					</div>
				</Popup>
			) : null}
		</>
	)
}
