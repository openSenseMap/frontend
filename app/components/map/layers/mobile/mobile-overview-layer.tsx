import bbox from '@turf/bbox'
import { point, featureCollection } from '@turf/helpers'
import { format } from 'date-fns'
import { type FeatureCollection, type Point } from 'geojson'
import { CalendarClock } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Source, Layer, useMap, Popup } from 'react-map-gl'
import MapLegend from './mobile-overview-legend'
import {
	type LocationPoint,
	categorizeIntoTrips,
} from '~/lib/mobile-box-helper'

const FIT_PADDING = 100

// Function to generate or select unique colors
function generateColors(count: number): string[] {
	const colors = [
		'#66c2a5',
		'#fc8d62',
		'#8da0cb',
		'#e78ac3',
		'#a6d854',
		'#ffd92f',
	]
	while (colors.length < count) {
		// repeat colors if needed
		colors.push(...colors)
	}
	return colors.slice(0, count)
}

export default function MobileOverviewLayer({
	locations,
}: {
	locations: LocationPoint[]
}) {
	// Generate trips and assign colors once
	const trips = useMemo(() => categorizeIntoTrips(locations, 50), [locations])

	const [sourceData, setSourceData] = useState<FeatureCollection<
		Point,
		{ color: string; tripNumber: number; timestamp: string }
	> | null>(null)
	const { osem: mapRef } = useMap()

	// Legend items state
	const [legendItems, setLegendItems] = useState<
		{ label: string; color: string }[]
	>([])

	// State to track the highlighted trip number
	const [highlightedTrip, setHighlightedTrip] = useState<number | null>(null)

	// State to track the popup information
	const [popupInfo, setPopupInfo] = useState<{
		longitude: number
		latitude: number
		startTime: string
		endTime: string
	} | null>(null)
	const [showOriginalColors, setShowOriginalColors] = useState(true)

	useEffect(() => {
		if (!trips || trips.length === 0) return

		const colors = generateColors(trips.length)

		// Convert trips into GeoJSON Points with a stable color for each trip
		const points = trips.flatMap((trip, index) =>
			trip.points.map((location) =>
				point([location.geometry.x, location.geometry.y], {
					color: colors[index] ?? '#000000', // Assign stable color per trip
					tripNumber: index + 1, // Add trip number metadata
					timestamp: location.time, // Add timestamp metadata
				}),
			),
		)

		// Set legend items for the trips
		const legend = trips.map((_, index) => ({
			label: `Trip ${index + 1}`,
			color: colors[index] ?? '#000000',
		}))

		setSourceData(featureCollection(points))
		setLegendItems(legend) // Set the legend items
	}, [trips])

	useEffect(() => {
		if (!mapRef || !sourceData) return

		const bounds = bbox(sourceData).slice(0, 4) as [
			number,
			number,
			number,
			number,
		]
		mapRef.fitBounds(bounds, {
			padding: {
				top: FIT_PADDING,
				bottom: FIT_PADDING,
				left: 500,
				right: FIT_PADDING,
			},
		})
	}, [mapRef, sourceData])

	const handleHover = useCallback(
		(event: any) => {
			if (!showOriginalColors) {
				setHighlightedTrip(null) // Ensure no highlight
				setPopupInfo(null) // Ensure no popup
				return
			}

			if (event.features && event.features.length > 0) {
				const feature = event.features[0]
				const { tripNumber } = feature.properties
				setHighlightedTrip(tripNumber) // Highlight the trip

				// Find the corresponding trip to get the time range
				const hoveredTrip = trips[tripNumber - 1]
				if (hoveredTrip) {
					const { startTime, endTime } = hoveredTrip
					const [longitude, latitude] = feature.geometry.coordinates
					setPopupInfo({ longitude, latitude, startTime, endTime })
				}
			} else {
				setHighlightedTrip(null) // Reset highlight if no feature is hovered
				setPopupInfo(null) // Hide the popup
			}
		},
		[showOriginalColors, trips], // Add dependencies here
	)

	useEffect(() => {
		if (!mapRef) return

		const onMouseMove = (event: any) => {
			if (!showOriginalColors) {
				mapRef.getCanvas().style.cursor = '' // Reset cursor
				return
			}

			mapRef.getCanvas().style.cursor = event.features?.length ? 'pointer' : ''
			handleHover(event)
		}

		const onMouseLeave = () => {
			if (!showOriginalColors) return
			mapRef.getCanvas().style.cursor = '' // Reset cursor
			setHighlightedTrip(null)
			setPopupInfo(null) // Hide popup on mouse leave
		}

		mapRef.on('mousemove', 'box-overview-layer', onMouseMove)
		mapRef.on('mouseleave', 'box-overview-layer', onMouseLeave)

		// Cleanup events on unmount or when `showOriginalColors` changes
		return () => {
			mapRef.off('mousemove', 'box-overview-layer', onMouseMove)
			mapRef.off('mouseleave', 'box-overview-layer', onMouseLeave)
		}
	}, [mapRef, handleHover, showOriginalColors, trips])

	useEffect(() => {
		if (highlightedTrip !== null) {
			const hoveredTrip = trips[highlightedTrip - 1] // Get the highlighted trip
			if (hoveredTrip) {
				// Find the first point of the trip to get the coordinates (longitude, latitude)
				const { startTime, endTime } = hoveredTrip
				const longitude = hoveredTrip.points[0]?.geometry.x ?? 0
				const latitude = hoveredTrip.points[0]?.geometry.y ?? 0

				// Set the popupInfo state with coordinates and time range
				setPopupInfo({ longitude, latitude, startTime, endTime })
			}
		} else {
			setPopupInfo(null) // Reset popupInfo if no trip is highlighted
		}
	}, [highlightedTrip, trips]) // Trigger when highlightedTrip or trips change

	if (!sourceData) return null

	return (
		<>
			<Source id="box-overview-source" type="geojson" data={sourceData}>
				<Layer
					id="box-overview-layer"
					type="circle"
					source="box-overview-source"
					paint={{
						'circle-color': showOriginalColors ? ['get', 'color'] : '#888', // Single color when toggled off
						'circle-radius': 3,
						'circle-opacity': showOriginalColors
							? [
									'case',
									['==', ['get', 'tripNumber'], highlightedTrip],
									1, // Full opacity for the highlighted trip
									0.2, // Reduced opacity for other trips
								]
							: 1, // Always full opacity when showing a single color
					}}
				/>
			</Source>
			{highlightedTrip && popupInfo && (
				<Popup
					longitude={popupInfo?.longitude || 0} // Default to 0 if no popupInfo
					latitude={popupInfo?.latitude || 0}
					closeButton={false}
					closeOnClick={false}
					anchor="top"
				>
					<div className="mb-2 flex items-center justify-center">
						<CalendarClock className="h-4 w-4 text-primary" />
					</div>
					<div className="space-y-1 text-center">
						<div>
							<p className="text-sm font-bold text-primary">
								{format(new Date(popupInfo?.startTime || ''), 'Pp')}
							</p>
						</div>
						<div>
							<span className="text-xs font-medium text-muted-foreground">
								To
							</span>
							<p className="text-sm font-bold text-primary">
								{format(new Date(popupInfo?.endTime || ''), 'Pp')}
							</p>
						</div>
					</div>
				</Popup>
			)}

			<MapLegend
				items={legendItems}
				position="top-right"
				toggleTrips={() => setShowOriginalColors(!showOriginalColors)}
				showOriginalColors={showOriginalColors}
				onLegendItemHover={(color) => {
					setHighlightedTrip(
						color
							? legendItems.findIndex((item) => item.color === color) + 1
							: null,
					)
				}}
			/>
		</>
	)
}
