import { type LayerProps } from 'react-map-gl'

// colors to use for the categories
const colors = ['#4EAF47', '#666', '#666', '#666']

// filters for classifying devices into three categories phenomenond on status
export const deviceStatusFilter = {
	active: ['==', ['get', 'status'], 'ACTIVE'],
	inactive: ['==', ['get', 'status'], 'INACTIVE'],
	old: ['==', ['get', 'status'], 'OLD'],
}

export const activeClusterLayer: LayerProps = {
	id: 'cluster',
	type: 'circle',
	source: 'devices',
	// filter: ["has", "point_count"],
	filter: ['==', 'cluster', true],
	paint: {
		'circle-color': 'transparent',
		'circle-radius': 20,
		'circle-opacity': 0.5,
		'circle-stroke-color': colors[0],
		'circle-translate': [5, 5],
		// "circle-stroke-color": [
		//   "interpolate",
		//   ["exponential", 0.5],
		//   ["zoom"],
		//   2,
		//   colors[0],
		//   4,
		//   colors[1],
		// ],
		'circle-stroke-width': 4,
		'circle-stroke-opacity': 0.5,
	},
}

export const inactiveClusterLayer: LayerProps = {
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
}

export const oldClusterLayer: LayerProps = {
	id: 'clusters',
	type: 'circle',
	source: 'devices',
	filter: ['has', 'point_count'],
	paint: {
		'circle-color': '#666',
		'circle-radius': 20,
	},
}

export const activeClusterCountLayer: LayerProps = {
	id: 'active-cluster-count',
	type: 'symbol',
	source: 'active-devices',
	filter: ['has', 'point_count'],
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-size': 12,
	},
}

export const inactiveClusterCountLayer: LayerProps = {
	id: 'inactive-cluster-count',
	type: 'symbol',
	source: 'inactive-devices',
	filter: ['has', 'point_count'],
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-size': 12,
	},
}

export const unclusteredPointLayer: LayerProps = {
	id: 'unclustered-point',
	type: 'symbol',
	source: 'devices',
	filter: ['!=', 'cluster', true],
	paint: {
		'icon-opacity': [
			'case',
			deviceStatusFilter.active,
			1,
			deviceStatusFilter.inactive,
			0.7,
			deviceStatusFilter.old,
			0.5,
			0.5,
		],
	},
	layout: {
		// get icon depending on source´s "exposure" property
		'icon-image': [
			'match',
			['get', 'exposure'],
			'INDOOR',
			'box',
			'OUTDOOR',
			'box',
			'MOBILE',
			'rocket',
			'UNKNOW',
			'box',
			'box',
		],
		// get the device name from the source's "name" property
		// "text-field": ["get", "name"],
		// "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
		// "text-anchor": "left",
	},
}

// add a symbol layer - text label
export const unclusteredPointLabelsLayer: LayerProps = {
	id: 'device-labels',
	type: 'symbol',
	source: 'devices',
	layout: {
		'text-field': ['get', 'name'],
		'text-size': 14,
		'text-anchor': 'center',
		'text-offset': [0, -1.5],
	},
	paint: {
		'text-color': '#ffff00',
		'text-halo-color': '#333333',
		'text-halo-width': 10,
	},
}

interface ObjectLiteral {
	[key: string]: LayerProps
}

export const phenomenonLayers: ObjectLiteral = {
	temperature: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 2.75,
				stops: [
					[1, 5],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				-10,
				'#9900cc',
				0,
				'#0000ff',
				10,
				'#0099ff',
				20,
				'#ffff00',
				30,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	relative_humidity: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				25,
				'#0000ff',
				50,
				'#0099ff',
				75,
				'#ffff00',
				100,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	barometric_pressure: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				25,
				'#0000ff',
				50,
				'#0099ff',
				75,
				'#ffff00',
				100,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	ambient_light: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				1000,
				'#0000ff',
				2000,
				'#0099ff',
				3000,
				'#ffff00',
				4000,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	ultraviolet_a_light: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				100,
				'#0000ff',
				200,
				'#0099ff',
				300,
				'#ffff00',
				400,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	pm10_concentration: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				15,
				'#0000ff',
				30,
				'#0099ff',
				45,
				'#ffff00',
				60,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
	pm25: {
		id: 'phenomenon-layer',
		type: 'circle',
		source: 'boxes',
		paint: {
			'circle-opacity': 0.7,
			'circle-radius': {
				base: 1.75,
				stops: [
					[1, 4],
					[22, 200],
				],
			},
			'circle-color': [
				'interpolate',
				['linear'],
				[
					'get',
					'value',
					['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
				],
				0,
				'#9900cc',
				10,
				'#0000ff',
				20,
				'#0099ff',
				30,
				'#ffff00',
				40,
				'#ff0000',
			],
			'circle-stroke-width': 1,
			'circle-stroke-color': 'black',
		},
	},
}

export const defaultLayer = {
	id: 'phenomenon-layer',
	type: 'circle',
	source: 'boxes',
	paint: {
		'circle-opacity': 0.7,
		'circle-radius': {
			base: 1.75,
			stops: [
				[1, 4],
				[22, 200],
			],
		},
		'circle-color': [
			'interpolate',
			['linear'],
			[
				'get',
				'value',
				['object', ['get', 'lastMeasurement', ['object', ['get', 'sensor']]]],
			],
			0,
			'#9900cc',
			25,
			'#0000ff',
			50,
			'#0099ff',
			75,
			'#ffff00',
			100,
			'#ff0000',
		],
		'circle-stroke-width': 1,
		'circle-stroke-color': 'black',
	},
}
