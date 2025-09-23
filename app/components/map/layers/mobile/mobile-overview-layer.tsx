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

// Clustering configuration
const CLUSTER_DISTANCE_METERS = 8 // Distance threshold for clustering
const MIN_CLUSTER_SIZE = 15 // Minimum points to form a cluster
const DENSITY_THRESHOLD = 0.5 // Only cluster the most dense 50% of candidate points

// Function to calculate distance between two points in meters
function calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
	const R = 6371000 // Earth's radius in meters
	const lat1Rad = (point1.geometry.y * Math.PI) / 180
	const lat2Rad = (point2.geometry.y * Math.PI) / 180
	const deltaLatRad = ((point2.geometry.y - point1.geometry.y) * Math.PI) / 180
	const deltaLonRad = ((point2.geometry.x - point1.geometry.x) * Math.PI) / 180

	const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
		Math.cos(lat1Rad) * Math.cos(lat2Rad) *
		Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

	return R * c
}

// Function to calculate density score for each point based on nearby neighbors
function calculateDensityScore(points: LocationPoint[], pointIndex: number, distanceThreshold: number): number {
	const targetPoint = points[pointIndex]
	let nearbyCount = 0
	let totalDistance = 0

	for (let i = 0; i < points.length; i++) {
		if (i === pointIndex) continue
		
		const distance = calculateDistance(targetPoint, points[i])
		if (distance <= distanceThreshold) {
			nearbyCount++
			totalDistance += distance
		}
	}

	// Higher score = more dense (more neighbors, closer together)
	// Avoid division by zero
	if (nearbyCount === 0) return 0
	
	// Score combines neighbor count with average proximity
	const averageDistance = totalDistance / nearbyCount
	const maxDistance = distanceThreshold
	const proximityScore = (maxDistance - averageDistance) / maxDistance
	
	return nearbyCount * (1 + proximityScore)
}

// Function to find all points within distance threshold from a center point
function findPointsInRadius(points: LocationPoint[], centerIndex: number, distanceThreshold: number): number[] {
	const pointsInRadius: number[] = [centerIndex] // Include the center point itself
	const centerPoint = points[centerIndex]

	for (let i = 0; i < points.length; i++) {
		if (i === centerIndex) continue
		
		const distance = calculateDistance(centerPoint, points[i])
		if (distance <= distanceThreshold) {
			pointsInRadius.push(i)
		}
	}

	return pointsInRadius
}

// Function to select only the most densely packed points from candidates
function selectDensestPoints(points: LocationPoint[], candidateIndices: number[], distanceThreshold: number, densityThreshold: number): number[] {
	// Calculate density score for each candidate point
	const pointsWithDensity = candidateIndices.map(index => ({
		index,
		densityScore: calculateDensityScore(points, index, distanceThreshold)
	}))

	// Sort by density score (highest first)
	pointsWithDensity.sort((a, b) => b.densityScore - a.densityScore)

	// Take only the top percentage based on density threshold
	const numToTake = Math.max(MIN_CLUSTER_SIZE, Math.ceil(pointsWithDensity.length * densityThreshold))
	const selectedPoints = pointsWithDensity.slice(0, numToTake)

	return selectedPoints.map(p => p.index)
}

// Function to calculate cluster quality focusing on spatial centrality
function calculateSpatialCentrality(points: LocationPoint[], centerIndex: number, clusterIndices: number[]): number {
	const centerPoint = points[centerIndex]
	let totalDistanceSquared = 0
	
	// Calculate sum of squared distances (minimize this for better centrality)
	for (const idx of clusterIndices) {
		if (idx === centerIndex) continue
		const distance = calculateDistance(centerPoint, points[idx])
		totalDistanceSquared += distance * distance
	}
	
	// Lower score means better centrality (center point minimizes total squared distances)
	return totalDistanceSquared / clusterIndices.length
}

// Function to find the most spatially central point within a potential cluster
function findOptimalClusterCenter(points: LocationPoint[], candidateIndices: number[], distanceThreshold: number): {
	centerIndex: number
	clusterIndices: number[]
	quality: number
} {
	// First, select only the most densely packed points from all candidates
	const densePointIndices = selectDensestPoints(points, candidateIndices, distanceThreshold, DENSITY_THRESHOLD)
	
	if (densePointIndices.length < MIN_CLUSTER_SIZE) {
		// If we don't have enough dense points, fall back to the original approach
		const fallbackCenter = candidateIndices[0]
		const fallbackCluster = findPointsInRadius(points, fallbackCenter, distanceThreshold)
		return {
			centerIndex: fallbackCenter,
			clusterIndices: fallbackCluster.length >= MIN_CLUSTER_SIZE ? fallbackCluster : [],
			quality: fallbackCluster.length >= MIN_CLUSTER_SIZE ? calculateSpatialCentrality(points, fallbackCenter, fallbackCluster) : Infinity
		}
	}

	let bestCenter = densePointIndices[0]
	let bestClusterIndices = densePointIndices
	let bestQuality = calculateSpatialCentrality(points, bestCenter, bestClusterIndices)
	
	// Test each dense point as a potential cluster center
	for (const candidateIndex of densePointIndices) {
		// For this center, find which dense points are within radius
		const clusterIndices = densePointIndices.filter(idx => {
			if (idx === candidateIndex) return true
			return calculateDistance(points[candidateIndex], points[idx]) <= distanceThreshold
		})
		
		// Only consider if cluster is large enough
		if (clusterIndices.length >= MIN_CLUSTER_SIZE) {
			const quality = calculateSpatialCentrality(points, candidateIndex, clusterIndices)
			
			// Better quality = lower sum of squared distances (more central)
			if (quality < bestQuality) {
				bestCenter = candidateIndex
				bestClusterIndices = clusterIndices
				bestQuality = quality
			}
		}
	}
	
	return {
		centerIndex: bestCenter,
		clusterIndices: bestClusterIndices,
		quality: bestQuality
	}
}

// Enhanced clustering algorithm that finds truly optimal spatial centers
function spatiallyOptimizedClustering(points: LocationPoint[], distanceThreshold: number, minClusterSize: number) {
	const clusters: LocationPoint[][] = []
	const visited = new Set<number>()
	
	// Find all dense regions (areas with enough points for clustering)
	const denseRegions: Array<{
		centerIndex: number
		clusterIndices: number[]
		quality: number
	}> = []

	// First pass: identify all potential dense regions
	for (let i = 0; i < points.length; i++) {
		if (visited.has(i)) continue
		
		const pointsInRadius = findPointsInRadius(points, i, distanceThreshold)
		
		if (pointsInRadius.length >= minClusterSize) {
			// Find the optimal center within this dense region, focusing only on densest points
			const optimalCenter = findOptimalClusterCenter(points, pointsInRadius, distanceThreshold)
			
			// Only add if we found a valid cluster
			if (optimalCenter.clusterIndices.length >= minClusterSize) {
				denseRegions.push(optimalCenter)
			}
		}
	}
	
	// Sort dense regions by quality (better spatial centrality first)
	denseRegions.sort((a, b) => a.quality - b.quality)
	
	// Second pass: greedily select non-overlapping clusters starting with best spatial centers
	for (const region of denseRegions) {
		// Check if any points in this cluster are already assigned
		if (region.clusterIndices.some(idx => visited.has(idx))) {
			continue
		}
		
		// Mark all points in this cluster as visited
		region.clusterIndices.forEach(idx => visited.add(idx))
		
		// Create the cluster using the optimal center's point collection
		const cluster = region.clusterIndices.map(idx => points[idx])
		clusters.push(cluster)
	}
	
	// Add remaining unvisited points as individual clusters
	for (let i = 0; i < points.length; i++) {
		if (!visited.has(i)) {
			clusters.push([points[i]])
		}
	}
	
	return clusters
}

// Calculate cluster center using the actual geometric centroid
function calculateOptimalClusterCenter(cluster: LocationPoint[], clusterId: string) {
	// Calculate geometric centroid (true center of mass)
	const centerX = cluster.reduce((sum, point) => sum + point.geometry.x, 0) / cluster.length
	const centerY = cluster.reduce((sum, point) => sum + point.geometry.y, 0) / cluster.length
	
	// Sort by timestamp to get earliest and latest
	const sortedByTime = cluster.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
	
	// Calculate additional metrics
	const startTime = sortedByTime[0].time
	const endTime = sortedByTime[sortedByTime.length - 1].time
	const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
	
	// Calculate cluster spread (max distance from centroid)
	const maxDistanceFromCenter = Math.max(...cluster.map(point => {
		const dx = point.geometry.x - centerX
		const dy = point.geometry.y - centerY
		return Math.sqrt(dx * dx + dy * dy) * 111320 // Convert to approximate meters
	}))
	
	return {
		coordinates: [centerX, centerY],
		pointCount: cluster.length,
		startTime,
		endTime,
		duration,
		maxSpread: maxDistanceFromCenter,
		isCluster: cluster.length > 1,
		clusterId: clusterId,
		originalPoints: cluster
	}
}

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
		colors.push(...colors)
	}
	return colors.slice(0, count)
}

export default function MobileOverviewLayer({
	locations,
}: {
	locations: LocationPoint[]
}) {
	
	const trips = useMemo(() => categorizeIntoTrips(locations, 50), [locations])
	const clusteredTrips = useMemo(() => {
		if (!trips || trips.length === 0) return []

		return trips.map((trip, tripIndex) => {
			const clusters = spatiallyOptimizedClustering(
				trip.points,
				CLUSTER_DISTANCE_METERS,
				MIN_CLUSTER_SIZE
			)
			
			return {
				...trip,
				clusters: clusters.map((cluster, clusterIndex) => 
					calculateOptimalClusterCenter(cluster, `trip-${tripIndex}-cluster-${clusterIndex}`)
				)
			}
		})
	}, [trips])

	const [sourceData, setSourceData] = useState<FeatureCollection<
		Point,
		{ 
			color: string
			tripNumber: number
			timestamp: string
			pointCount?: number
			isCluster?: boolean
			startTime?: string
			endTime?: string
			duration?: number
			maxSpread?: number
			clusterId?: string
		}
	> | null>(null)

	const [expandedSourceData, setExpandedSourceData] = useState<FeatureCollection<
		Point,
		{ 
			color: string
			tripNumber: number
			timestamp: string
			clusterId: string
		}
	> | null>(null)
	
	const { osem: mapRef } = useMap()

	const [legendItems, setLegendItems] = useState<
		{ label: string; color: string }[]
	>([])

	const [highlightedTrip, setHighlightedTrip] = useState<number | null>(null)

	const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)

	const [popupInfo, setPopupInfo] = useState<{
		longitude: number
		latitude: number
		startTime: string
		endTime: string
		pointCount?: number
		duration?: number
		maxSpread?: number
		isCluster?: boolean
	} | null>(null)
	
	const [showOriginalColors, setShowOriginalColors] = useState(true)

	useEffect(() => {
		if (!clusteredTrips || clusteredTrips.length === 0) return

		const colors = generateColors(clusteredTrips.length)

		// Convert clustered trips into GeoJSON Points
		const points = clusteredTrips.flatMap((trip, index) =>
			trip.clusters.map((cluster) =>
				point(cluster.coordinates, {
					color: colors[index],
					tripNumber: index + 1,
					timestamp: cluster.startTime,
					pointCount: cluster.pointCount,
					isCluster: cluster.isCluster,
					startTime: cluster.startTime,
					endTime: cluster.endTime,
					duration: cluster.duration,
					maxSpread: cluster.maxSpread,
					clusterId: cluster.clusterId,
				}),
			),
		)

		const expandedPoints = clusteredTrips.flatMap((trip, tripIndex) =>
			trip.clusters.flatMap((cluster) => {
				if (!cluster.isCluster || !cluster.originalPoints) return []
				
				return cluster.originalPoints.map((originalPoint) =>
					point([originalPoint.geometry.x, originalPoint.geometry.y], {
						color: colors[tripIndex],
						tripNumber: tripIndex + 1,
						timestamp: originalPoint.time,
						clusterId: cluster.clusterId,
					})
				)
			})
		)

		const legend = clusteredTrips.map((_, index) => ({
			label: `Trip ${index + 1}`,
			color: colors[index],
		}))

		setSourceData(featureCollection(points))
		setExpandedSourceData(featureCollection(expandedPoints))
		setLegendItems(legend)
	}, [clusteredTrips])

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
				setHighlightedTrip(null)
				setPopupInfo(null)
				setHoveredCluster(null)
				return
			}

			if (event.features && event.features.length > 0) {
				const feature = event.features[0]
				const { tripNumber, startTime, endTime, pointCount, duration, maxSpread, isCluster, clusterId } = feature.properties
				setHighlightedTrip(tripNumber)

				// Set hovered cluster if it's a cluster
				if (isCluster && clusterId) {
					setHoveredCluster(clusterId)
				} else {
					setHoveredCluster(null)
				}

				const [longitude, latitude] = feature.geometry.coordinates
				setPopupInfo({ 
					longitude, 
					latitude, 
					startTime, 
					endTime, 
					pointCount,
					duration,
					maxSpread,
					isCluster 
				})
			} else {
				setHighlightedTrip(null)
				setPopupInfo(null)
				setHoveredCluster(null)
			}
		},
		[showOriginalColors],
	)

	useEffect(() => {
		if (!mapRef) return

		const onMouseMove = (event: any) => {
			if (!showOriginalColors) {
				mapRef.getCanvas().style.cursor = ''
				return
			}

			mapRef.getCanvas().style.cursor = event.features?.length ? 'pointer' : ''
			handleHover(event)
		}

		const onMouseLeave = () => {
			if (!showOriginalColors) return
			mapRef.getCanvas().style.cursor = ''
			setHighlightedTrip(null)
			setPopupInfo(null)
			setHoveredCluster(null)
		}

		mapRef.on('mousemove', 'box-overview-layer', onMouseMove)
		mapRef.on('mouseleave', 'box-overview-layer', onMouseLeave)

		return () => {
			mapRef.off('mousemove', 'box-overview-layer', onMouseMove)
			mapRef.off('mouseleave', 'box-overview-layer', onMouseLeave)
		}
	}, [mapRef, handleHover, showOriginalColors])
	
	const formatDuration = (durationMs: number): string => {
		const minutes = Math.floor(durationMs / (1000 * 60))
		const hours = Math.floor(minutes / 60)
		
		if (hours > 0) {
			const remainingMinutes = minutes % 60
			return `${hours}h ${remainingMinutes}m`
		}
		return `${minutes}m`
	}

	if (!sourceData) return null

	return (
		<>
			<Source id="box-overview-source" type="geojson" data={sourceData}>
  				<Layer
    				id="box-overview-layer"
    				type="circle"
    				source="box-overview-source"
    				paint={{
      					'circle-color': showOriginalColors ? ['get', 'color'] : '#888',
      					'circle-radius': [
        				'case',
        				['get', 'isCluster'],
        				[
          					'interpolate',
          				['linear'],
          			['get', 'pointCount'],
          1, 6,
          15, 10,
          50, 14,
          100, 18,
          200, 22
        ],
        4
      ],
      'circle-opacity': showOriginalColors
        ? [
            'case',
            ['==', ['get', 'tripNumber'], highlightedTrip],
            0.9,
            0.6,
          ]
        : 0.8,
      'circle-stroke-width': [
        'case',
        [
          'all',
          ['get', 'isCluster'],
          ['==', ['get', 'cluster_id'], hoveredCluster]
        ],
        4, // thicker when hovered
        ['case', ['get', 'isCluster'], 3, 1]
      ],
      'circle-stroke-color': [
        'case',
        [
          'all',
          ['get', 'isCluster'],
          ['==', ['get', 'cluster_id'], hoveredCluster]
        ],
        '#000', // black when hovered
        showOriginalColors ? ['get', 'color'] : '#333'
      ],
      'circle-stroke-opacity': showOriginalColors
        ? [
            'case',
            ['==', ['get', 'tripNumber'], highlightedTrip],
            1,
            0.4,
          ]
        : 0.6,
    }}
  />

  {/* Text layer for cluster point counts */}
  <Layer
    id="box-overview-cluster-text"
    type="symbol"
    source="box-overview-source"
    filter={['get', 'isCluster']}
    layout={{
      'text-field': ['get', 'pointCount'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    }}
    paint={{
      'text-color': '#fff',
      'text-halo-color': '#000',
      'text-halo-width': 1,
      'text-opacity': showOriginalColors
        ? [
            'case',
            ['==', ['get', 'tripNumber'], highlightedTrip],
            1,
            0.8,
          ]
        : 1,
    }}
  />
</Source>

{/* Expanded cluster points - shown on hover */}
{hoveredCluster && expandedSourceData && (
  <Source id="box-overview-expanded-source" type="geojson" data={expandedSourceData}>
    <Layer
      id="box-overview-expanded-layer"
      type="circle"
      source="box-overview-expanded-source"
      filter={['==', ['get', 'clusterId'], hoveredCluster]}
      paint={{
        'circle-color': ['get', 'color'],
        'circle-radius': 4,
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#222',
        'circle-stroke-opacity': 1,
      }}
    />
  </Source>
)}

			{highlightedTrip && popupInfo && (
				<Popup
					longitude={popupInfo.longitude}
					latitude={popupInfo.latitude}
					closeButton={false}
					closeOnClick={false}
					anchor="top"
				>
					<div className="mb-2 flex items-center justify-center">
						<CalendarClock className="h-4 w-4 text-primary" />
					</div>
					<div className="space-y-1 text-center">
						{popupInfo.isCluster && (
							<div className="mb-2">
								<p className="text-xs font-medium text-muted-foreground">
									Cluster of {popupInfo.pointCount} points
								</p>
								{popupInfo.duration && (
									<p className="text-xs text-muted-foreground">
										Duration: {formatDuration(popupInfo.duration)}
									</p>
								)}
								{popupInfo.maxSpread && (
									<p className="text-xs text-muted-foreground">
										Spread: {Math.round(popupInfo.maxSpread)}m
									</p>
								)}
							</div>
						)}
						<div>
							<p className="text-sm font-bold text-primary">
								{format(new Date(popupInfo.startTime), 'Pp')}
							</p>
						</div>
						{popupInfo.isCluster && popupInfo.startTime !== popupInfo.endTime && (
							<div>
								<span className="text-xs font-medium text-muted-foreground">
									To
								</span>
								<p className="text-sm font-bold text-primary">
									{format(new Date(popupInfo.endTime), 'Pp')}
								</p>
							</div>
						)}
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