import { type LayerProps } from 'react-map-gl/maplibre'
import type { ExpressionSpecification } from 'maplibre-gl'

const colors = ['#4EAF47', '#666', '#666', '#666']

const expression = <T extends ExpressionSpecification>(value: T) => value

export const deviceStatusFilter = {
	active: expression(['==', ['get', 'status'], 'ACTIVE']),
	inactive: expression(['==', ['get', 'status'], 'INACTIVE']),
	old: expression(['==', ['get', 'status'], 'OLD']),
}

const valueExpression = expression([
	'get',
	'value',
	['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
])

const radius = (base: number, low: number, high: number) =>
	expression(['interpolate', ['exponential', base], ['zoom'], 1, low, 22, high])

const phenomenonLayer = (
	circleRadius: ExpressionSpecification,
	stops: Array<[number, string]>,
) =>
	({
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': circleRadius,
			'circle-color': expression([
				'interpolate',
				['linear'],
				valueExpression,
				...stops.flat(),
			]),
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	}) satisfies LayerProps

export const activeClusterLayer = {
	id: 'cluster',
	type: 'circle',
	source: 'devices',
	filter: ['==', ['get', 'cluster'], true],
	paint: {
		'circle-color': 'transparent',
		'circle-radius': 20,
		'circle-opacity': 0.5,
		'circle-stroke-color': colors[0],
		'circle-translate': [5, 5],
		'circle-stroke-width': 4,
		'circle-stroke-opacity': 0.5,
	},
} satisfies LayerProps

export const inactiveClusterLayer = {
	id: 'inactive-cluster',
	type: 'circle',
	source: 'inactive-devices',
	filter: ['has', 'point_count'],
	paint: {
		'circle-color': 'transparent',
		'circle-radius': 20,
		'circle-opacity': 0.5,
		'circle-stroke-color': colors[1],
		'circle-stroke-width': 4,
	},
} satisfies LayerProps

export const oldClusterLayer = {
	id: 'clusters',
	type: 'circle',
	source: 'devices',
	filter: ['has', 'point_count'],
	paint: {
		'circle-color': '#666',
		'circle-radius': 20,
	},
} satisfies LayerProps

export const activeClusterCountLayer = {
	id: 'active-cluster-count',
	type: 'symbol',
	source: 'active-devices',
	filter: ['has', 'point_count'],
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-size': 12,
	},
} satisfies LayerProps

export const inactiveClusterCountLayer = {
	id: 'inactive-cluster-count',
	type: 'symbol',
	source: 'inactive-devices',
	filter: ['has', 'point_count'],
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-size': 12,
	},
} satisfies LayerProps

export const unclusteredPointLayer = {
	id: 'unclustered-point',
	type: 'symbol',
	source: 'devices',
	filter: ['!=', ['get', 'cluster'], true],
	paint: {
		'icon-opacity': expression([
			'case',
			deviceStatusFilter.active,
			1,
			deviceStatusFilter.inactive,
			0.7,
			deviceStatusFilter.old,
			0.5,
			0.5,
		]),
	},
	layout: {
		'icon-image': expression([
			'match',
			['get', 'exposure'],
			'INDOOR',
			'box',
			'OUTDOOR',
			'box',
			'MOBILE',
			'rocket',
			'UNKNOWN',
			'box',
			'box',
		]),
	},
} satisfies LayerProps

export const unclusteredPointLabelsLayer = {
	id: 'device-labels',
	type: 'symbol',
	source: 'devices',
	layout: {
		'text-field': expression(['get', 'name']),
		'text-size': 14,
		'text-anchor': 'center',
		'text-offset': [0, -1.5],
	},
	paint: {
		'text-color': '#ffff00',
		'text-halo-color': '#333333',
		'text-halo-width': 10,
	},
} satisfies LayerProps

export const phenomenonLayers: Record<string, LayerProps> = {
	temperature: phenomenonLayer(radius(2.75, 5, 200), [
		[-10, '#9900cc'],
		[0, '#0000ff'],
		[10, '#0099ff'],
		[20, '#ffff00'],
		[30, '#ff0000'],
	]),

	relative_humidity: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[25, '#0000ff'],
		[50, '#0099ff'],
		[75, '#ffff00'],
		[100, '#ff0000'],
	]),

	barometric_pressure: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[25, '#0000ff'],
		[50, '#0099ff'],
		[75, '#ffff00'],
		[100, '#ff0000'],
	]),

	ambient_light: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[1000, '#0000ff'],
		[2000, '#0099ff'],
		[3000, '#ffff00'],
		[4000, '#ff0000'],
	]),

	ultraviolet_a_light: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[100, '#0000ff'],
		[200, '#0099ff'],
		[300, '#ffff00'],
		[400, '#ff0000'],
	]),

	pm10_concentration: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[15, '#0000ff'],
		[30, '#0099ff'],
		[45, '#ffff00'],
		[60, '#ff0000'],
	]),

	pm25: phenomenonLayer(radius(1.75, 4, 200), [
		[0, '#9900cc'],
		[10, '#0000ff'],
		[20, '#0099ff'],
		[30, '#ffff00'],
		[40, '#ff0000'],
	]),
} satisfies Record<string, LayerProps>

export const defaultLayer = phenomenonLayer(radius(1.75, 4, 200), [
	[0, '#9900cc'],
	[25, '#0000ff'],
	[50, '#0099ff'],
	[75, '#ffff00'],
	[100, '#ff0000'],
])