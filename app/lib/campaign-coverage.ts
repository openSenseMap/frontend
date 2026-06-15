import bbox from '@turf/bbox'
import { type Feature, type FeatureCollection, type Polygon } from 'geojson'
import { type CampaignArea } from './campaign'

export type CampaignCoverageStatus = 'empty' | 'partial' | 'complete'

export type CampaignCoverageCellProperties = {
	id: string
	row: number
	column: number
	status: CampaignCoverageStatus
	deviceCount: number
	measurementCount: number
}

export type CampaignCoverageCell = Feature<
	Polygon,
	CampaignCoverageCellProperties
>

export type CampaignCoverageGrid = FeatureCollection<
	Polygon,
	CampaignCoverageCellProperties
>

export type CampaignCoveragePoint = {
	deviceId: string
	deviceName: string
	longitude: number
	latitude: number
	measurementCount: number
	sensorCount: number
}

export type CampaignCoverageSummary = {
	totalCells: number
	completeCells: number
	partialCells: number
	emptyCells: number
	coveragePercent: number
	matchingDeviceCount: number
	matchingMeasurementCount: number
}

export type CampaignCoverage = {
	grid: CampaignCoverageGrid
	points: CampaignCoveragePoint[]
	summary: CampaignCoverageSummary
}

export type CampaignCoverageRequirements = {
	gridSize: number
	minDevicesPerCell: number
	minMeasurementsPerCell: number
}

export function buildCampaignCoverageGrid({
	area,
	points,
	requirements,
}: {
	area: CampaignArea
	points: CampaignCoveragePoint[]
	requirements: CampaignCoverageRequirements
}): CampaignCoverage {
	const cells = createGridCells(area, requirements.gridSize)

	const nextCells = cells.map((cell) => {
		const pointsInCell = points.filter((point) =>
			pointInPolygon(
				[point.longitude, point.latitude],
				cell.geometry.coordinates[0],
			),
		)
		const deviceIds = new Set(pointsInCell.map((point) => point.deviceId))
		const measurementCount = pointsInCell.reduce(
			(total, point) => total + point.measurementCount,
			0,
		)

		const deviceCount = deviceIds.size
		const hasEnoughDevices = deviceCount >= requirements.minDevicesPerCell
		const hasEnoughMeasurements =
			measurementCount >= requirements.minMeasurementsPerCell

		const status: CampaignCoverageStatus =
			hasEnoughDevices && hasEnoughMeasurements
				? 'complete'
				: deviceCount > 0 || measurementCount > 0
					? 'partial'
					: 'empty'

		return {
			...cell,
			properties: {
				...cell.properties,
				status,
				deviceCount,
				measurementCount,
			},
		}
	})

	const completeCells = nextCells.filter(
		(cell) => cell.properties.status === 'complete',
	).length
	const partialCells = nextCells.filter(
		(cell) => cell.properties.status === 'partial',
	).length
	const emptyCells = nextCells.filter(
		(cell) => cell.properties.status === 'empty',
	).length

	return {
		grid: {
			type: 'FeatureCollection',
			features: nextCells,
		},
		points,
		summary: {
			totalCells: nextCells.length,
			completeCells,
			partialCells,
			emptyCells,
			coveragePercent:
				nextCells.length > 0
					? Math.round((completeCells / nextCells.length) * 100)
					: 0,
			matchingDeviceCount: new Set(points.map((point) => point.deviceId)).size,
			matchingMeasurementCount: points.reduce(
				(total, point) => total + point.measurementCount,
				0,
			),
		},
	}
}

export function createGridCells(area: CampaignArea, gridSize: number) {
	const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox(area)
	const longitudeStep = (maxLongitude - minLongitude) / gridSize
	const latitudeStep = (maxLatitude - minLatitude) / gridSize
	const polygon = area.features[0]?.geometry.coordinates[0] ?? []
	const cells: CampaignCoverageCell[] = []

	for (let row = 0; row < gridSize; row += 1) {
		for (let column = 0; column < gridSize; column += 1) {
			const west = minLongitude + column * longitudeStep
			const east = west + longitudeStep
			const south = minLatitude + row * latitudeStep
			const north = south + latitudeStep
			const center: [number, number] = [(west + east) / 2, (south + north) / 2]

			if (!pointInPolygon(center, polygon)) continue

			cells.push({
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[west, south],
							[east, south],
							[east, north],
							[west, north],
							[west, south],
						],
					],
				},
				properties: {
					id: `${row}-${column}`,
					row,
					column,
					status: 'empty',
					deviceCount: 0,
					measurementCount: 0,
				},
			})
		}
	}

	return cells
}

export function pointInCampaignArea(
	point: [number, number],
	area: CampaignArea,
) {
	const polygon = area.features[0]?.geometry.coordinates[0]
	return polygon ? pointInPolygon(point, polygon) : false
}

function pointInPolygon(point: [number, number], polygon: number[][]) {
	const [longitude, latitude] = point
	let inside = false

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i]
		const [xj, yj] = polygon[j]
		const intersects =
			yi > latitude !== yj > latitude &&
			longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi

		if (intersects) inside = !inside
	}

	return inside
}
