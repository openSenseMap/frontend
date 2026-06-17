/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Feature, type FeatureCollection, type Point } from 'geojson'
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
	type MapRef,
	MapProvider,
	Layer,
	Source,
	type MapInstance,
	type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import {
	Outlet,
	useNavigate,
	useSearchParams,
	useLoaderData,
	useParams,
} from 'react-router'
import { type Route } from './+types/explore'
import Header from '~/components/header'
import Map from '~/components/map'
import { phenomenonLayers, defaultLayer } from '~/components/map/layers'
import Legend, { type LegendValue } from '~/components/map/legend'
import { getDevices, getDevicesWithSensors } from '~/db/models/device.server'
import { getMeasurement } from '~/db/models/measurement.query.server'
import { getProfileByUserId } from '~/db/models/profile.server'
import { getSensors } from '~/db/models/sensor.server'
import { type Device } from '~/db/schema'
import { getCSV, getJSON, getTXT } from '~/lib/file-exports'
import { getLocale } from '~/middleware/i18next'
import { getUser, getUserSession } from '~/services/session-service.server'
import { getFilteredDevices } from '~/utils'
import maplibregl, {
	type LngLatLike,
	type MapLayerMouseEvent,
	type MapLibreEvent,
	type MapSourceDataEvent,
	type MapStyleDataEvent,
	type MapLibreMap,
	type StyleImageMetadata,
	type FilterSpecification,
} from 'maplibre-gl'
import BoxMarker from '~/components/map/layers/cluster/box-marker'
import { ClusterMarker } from '~/components/cluster-marker'
// import MapHeader from '~/components/map/topbar'
// import { getMeasurementsCount } from '~/db/models/measurement.server'
import { getTags } from '~/services/device-service.server'
import { getPhenomena } from '~/db/models/phenomena.server'
// import { DOWNLOAD_FILTER_KEYS } from '~/components/header/download'

const INITIAL_VIEW_STATE = {
	zoom: 2,
	latitude: 7,
	longitude: 52,
} as const

type ClusterMarkerRecord = {
	marker: maplibregl.Marker
	signature: string
}

function parseMapHash(hash: string) {
	const match = hash.match(
		/^#?(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/,
	)

	if (!match) return null

	const [, zoom, latitude, longitude] = match

	return {
		zoom: Number(zoom),
		latitude: Number(latitude),
		longitude: Number(longitude),
	}
}

// function parseCsv(value: FormDataEntryValue | null): string[] {
// 	if (typeof value !== 'string') return []

// 	return value
// 		.split(',')
// 		.map((item) => item.trim())
// 		.filter(Boolean)
// }

// function getDownloadFilterParams(formData: FormData) {
// 	const filterParams = new URLSearchParams()

// 	for (const key of DOWNLOAD_FILTER_KEYS) {
// 		const value = formData.get(key)

// 		if (typeof value === 'string' && value.length > 0) {
// 			filterParams.set(key, value)
// 		}
// 	}

// 	return filterParams
// }

export async function action({ request }: { request: Request }) {
	const deviceLimit = 50
	const sensorIds: Array<string> = []
	const measurements: Array<object> = []
	const formdata = await request.formData()
	const deviceIds = (formdata.get('devices') as string).split(',')
	const format = formdata.get('format') as string
	const aggregate = formdata.get('aggregate') as string
	const includeFields = {
		title: formdata.get('title') === 'on',
		unit: formdata.get('unit') === 'on',
		value: formdata.get('value') === 'on',
		timestamp: formdata.get('timestamp') === 'on',
	}

	if (deviceIds.length >= deviceLimit) {
		return Response.json({
			error: 'error',
			link: 'https://archive.opensensemap.org/',
		})
	}
	for (const device of deviceIds) {
		const sensors = await getSensors(device)
		for (const sensor of sensors) {
			sensorIds.push(sensor.id)
			const measurement = await getMeasurement(sensor.id, aggregate)
			measurement.map((m: any) => {
				m['title'] = sensor.title
				m['unit'] = sensor.unit
			})

			measurements.push(measurement)
		}
	}

	let content = ''
	let contentType = 'text/plain'
	let fileName = ''

	if (format === 'csv') {
		const result = getCSV(measurements, includeFields)
		content = result.content
		fileName = result.fileName
		contentType = result.contentType
	} else if (format === 'json') {
		const result = getJSON(measurements, includeFields)
		content = result.content
		fileName = result.fileName
		contentType = result.contentType
	} else {
		// txt format
		const result = getTXT(measurements, includeFields)
		content = result.content
		fileName = result.fileName
		contentType = result.contentType
	}

	return Response.json({
		href: `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`,
		download: fileName,
	})
}

export async function loader({ context, request }: Route.LoaderArgs) {
	//* Get filter params
	let locale = getLocale(context)
	const url = new URL(request.url)
	const filterParams = url.search
	const urlFilterParams = new URLSearchParams(url.search)

	// check if sensors are queried - if not get devices only to reduce load
	const devices = !urlFilterParams.get('phenomenon')
		? await getDevices('geojson')
		: await getDevicesWithSensors()

	const session = await getUserSession(request)
	const message = session.get('global_message') || null

	var filteredDevices = getFilteredDevices(devices, urlFilterParams)

	const user = await getUser(request)
	//const phenomena = await getPhenomena();

	if (user) {
		const profile = await getProfileByUserId(user.id)
		const userLocale = user.language
			? user.language.split(/[_-]/)[0].toLowerCase()
			: 'en'
		return {
			devices,
			user,
			profile,
			filteredDevices,
			filterParams,
			locale: userLocale,
			//phenomena
		}
	}
	return {
		devices,
		user,
		profile: null,
		filterParams,
		filteredDevices,
		message,
		locale,
		//phenomena,
	}
}

// This is for the live data display. The 21-06-2023 works with the seed Data, for Production take now minus 10 minutes
let currentDate = new Date('2023-06-21T14:13:11.024Z')
if (process.env.NODE_ENV === 'production') {
	currentDate = new Date(Date.now() - 1000 * 600)
}

export default function Explore() {
	// data from our loader
	const { devices, filteredDevices } = useLoaderData<typeof loader>()
	const mapRef = useRef<MapRef | null>(null)
	// MapLibre markers are imperative DOM nodes, so refs avoid stale React state.
	const clusterMarkersRef = useRef<Record<string, ClusterMarkerRecord>>({})
	const visibleClusterIdsRef = useRef<Set<string>>(new Set())
	const navigate = useNavigate()
	// const [showSearch, setShowSearch] = useState<boolean>(false);
	const clusterMarkers = useMemo<Record<string, maplibregl.Marker>>(
		() => ({}),
		[],
	)
	const [onScreenClusterMarkers, setOnScreenClusterMarkers] = useState<
		Record<string, maplibregl.Marker>
	>({})
	const [selectedPheno, setSelectedPheno] = useState<any | undefined>(undefined)
	const [searchParams] = useSearchParams()
	const [filteredData, setFilteredData] = useState<
		GeoJSON.FeatureCollection<Point, any>
	>({
		type: 'FeatureCollection',
		features: [],
	})
	const [hoveredFeatureId, setHoveredFeatureId] = useState<
		string | number | null
	>(null)

	const deviceNamePopup = useMemo(
		() =>
			new maplibregl.Popup({
				closeButton: false,
				closeOnClick: false,
				closeOnMove: true,
				anchor: 'left',
				offset: [15, 0],
			}),
		[],
	)

	//listen to search params change
	// useEffect(() => {
	//   //filters devices for pheno
	//   if (searchParams.has("mapPheno") && searchParams.get("mapPheno") != "all") {
	//     let sensorsFiltered: any = [];
	//     let currentParam = searchParams.get("mapPheno");
	//     //check if pheno exists in sensor-wiki data
	//     let pheno = data.phenomena.filter(
	//       (pheno: any) => pheno.slug == currentParam?.toString(),
	//     );
	//     if (pheno[0]) {
	//       setSelectedPheno(pheno[0]);
	//       data.devices.features.forEach((device: any) => {
	//         device.properties.sensors.forEach((sensor: Sensor) => {
	//           if (
	//             sensor.sensorWikiPhenomenon == currentParam &&
	//             sensor.lastMeasurement
	//           ) {
	//             const lastMeasurementDate = new Date(
	//               //@ts-ignore
	//               sensor.lastMeasurement.createdAt,
	//             );
	//             //take only measurements in the last 10mins
	//             //@ts-ignore
	//             if (currentDate < lastMeasurementDate) {
	//               sensorsFiltered.push({
	//                 ...device,
	//                 properties: {
	//                   ...device.properties,
	//                   sensor: {
	//                     ...sensor,
	//                     lastMeasurement: {
	//                       //@ts-ignore
	//                       value: parseFloat(sensor.lastMeasurement.value),
	//                       //@ts-ignore
	//                       createdAt: sensor.lastMeasurement.createdAt,
	//                     },
	//                   },
	//                 },
	//               });
	//             }
	//           }
	//         });
	//         return false;
	//       });
	//       setFilteredData({
	//         type: "FeatureCollection",
	//         features: sensorsFiltered,
	//       });
	//     }
	//   } else {
	//     setSelectedPheno(undefined);
	//   }
	//   // eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [searchParams]);

	function calculateLabelPositions(length: number): string[] {
		const positions: string[] = []
		for (let i = length - 1; i >= 0; i--) {
			const position =
				i === length - 1 ? '95%' : `${((i / (length - 1)) * 100).toFixed(0)}%`
			positions.push(position)
		}
		return positions
	}

	const legendLabels = () => {
		const values =
			//@ts-ignore
			phenomenonLayers[selectedPheno.slug].paint['circle-color'].slice(3)
		const numbers = values.filter((v: number | string) => typeof v === 'number')
		const colors = values.filter((v: number | string) => typeof v === 'string')
		const positions = calculateLabelPositions(numbers.length)

		const legend: LegendValue[] = []
		const length = numbers.length
		for (let i = 0; i < length; i++) {
			const legendObj: LegendValue = {
				value: numbers[i],
				color: colors[i],
				position: positions[i],
			}
			legend.push(legendObj)
		}
		return legend
	}

	// // /**
	// //  * Focus the search input when the search overlay is displayed
	// //  */
	// // const focusSearchInput = () => {
	// //   searchRef.current?.focus();
	// // };

	// /**
	//  * Display the search overlay when the ctrl + k key combination is pressed
	//  */
	// useHotkeys([
	//   [
	//     "ctrl+K",
	//     () => {
	//       setShowSearch(!showSearch);
	//       setTimeout(() => {
	//         focusSearchInput();
	//       }, 100);
	//     },
	//   ],
	// ]);

	const onMapClick = async (e: MapLayerMouseEvent) => {
		if (e.features && e.features.length > 0) {
			const feature = e.features[0]
			const map = e.target
			const coordinates = (feature.geometry as Point).coordinates as [
				number,
				number,
			]

			if (
				feature.layer?.id === 'phenomenon-layer' ||
				feature.layer?.id === 'devices-symbol-layer'
			) {
				map.flyTo({
					center: coordinates,
					zoom: Math.max(map.getZoom(), 14),
					animate: true,
					speed: 1.6,
					essential: true,
				})
				void navigate(
					`/explore/${feature.properties?.id}?${searchParams.toString()}`,
				)
			}

			if (feature.layer?.id === 'devices-clusters-layer') {
				const zoom = await (
					map.getSource(feature.source) as maplibregl.GeoJSONSource
				).getClusterExpansionZoom(feature.properties?.cluster_id)
				map.easeTo({
					center: coordinates,
					zoom: zoom,
					duration: 200,
					essential: true,
				})
			}
		}
	}

	const handleMouseMove = useCallback(
		(e: MapLayerMouseEvent) => {
			if (e.features && e.features.length > 0) {
				e.target.getCanvas().style.cursor = 'pointer'
				const feature = e.features[0]
				if (
					feature.layer.id !== 'devices-symbol-layer' ||
					feature.id === undefined
				)
					return
				if (hoveredFeatureId)
					e.target.setFeatureState(
						{ source: 'osem-devices', id: hoveredFeatureId },
						{ hover: false },
					)
				setHoveredFeatureId(feature.id)
				e.target.setFeatureState(
					{ source: 'osem-devices', id: feature.id },
					{ hover: true },
				)
				const coordinates = (feature.geometry as Point).coordinates.slice()
				// Ensure that if the map is zoomed out such that multiple
				// copies of the feature are visible, the popup appears
				// over the copy being pointed to.
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
				}
				deviceNamePopup
					.setLngLat(coordinates as LngLatLike)
					.setHTML(feature.properties.name)
					.addTo(e.target)
			} else {
				e.target.getCanvas().style.cursor = ''
			}
		},
		[hoveredFeatureId],
	)

	const handleMouseLeave = useCallback(
		(e: MapLayerMouseEvent) => {
			deviceNamePopup.remove()
			if (hoveredFeatureId) {
				e.target.setFeatureState(
					{ source: 'osem-devices', id: hoveredFeatureId },
					{ hover: false },
				)
			}
			setHoveredFeatureId(null)
		},
		[hoveredFeatureId],
	)

	//* fly to device location when url inludes deviceId
	const { deviceId } = useParams()
	var deviceLoc: any
	let selectedDevice: any
	if (deviceId) {
		selectedDevice = (devices as any).features.find(
			(device: any) => device.properties.id === deviceId,
		)
		deviceLoc = [
			selectedDevice?.properties.latitude,
			selectedDevice?.properties.longitude,
		]
	}

	const selectedDeviceId = selectedDevice?.properties.id

	const deviceLayerFilter: FilterSpecification = selectedDeviceId
		? [
				'all',
				['!', ['has', 'point_count']],
				['!=', ['get', 'id'], selectedDeviceId],
			]
		: ['!', ['has', 'point_count']]

	const buildLayerFromPheno = () => {
		//TODO: ADD VALUES TO DEFAULTLAYER FROM selectedPheno.ROV or min/max from values.
		return defaultLayer
	}

	const loadImageIfNotExists = async (
		map: MapInstance,
		id: string,
		url: string,
	) => {
		if (!map.getImage(id)) {
			const imgResponse = await map.loadImage(url)
			map.addImage(id, imgResponse.data)
		}
	}

	const handleMapLoad = async (e: MapLibreEvent) => {
		const map = e.target
		await Promise.allSettled([
			loadImageIfNotExists(
				map,
				'osem-device-active',
				'/img/device_marker_active.png',
			),
			loadImageIfNotExists(
				map,
				'osem-device-inactive',
				'/img/device_marker_inactive.png',
			),
			loadImageIfNotExists(
				map,
				'osem-device-old',
				'/img/device_marker_old.png',
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-active',
				'/img/mobile_marker_active.png',
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-inactive',
				'/img/mobile_marker_inactive.png',
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-old',
				'/img/mobile_marker_old.png',
			),
		])
	}

	const removeAllClusterMarkers = useCallback(() => {
		// Used when the cluster layer is hidden or the explore map unmounts.
		for (const { marker } of Object.values(clusterMarkersRef.current)) {
			marker.remove()
		}

		clusterMarkersRef.current = {}
		visibleClusterIdsRef.current = new Set()
	}, [])

	const updateClusterMarkers = useCallback(
		(map: MapInstance) => {
			if (selectedPheno || !map.getLayer('devices-clusters-layer')) {
				removeAllClusterMarkers()
				return
			}

			// Sync against rendered features so removed layer clusters lose their HTML marker.
			const renderedClusters = map.queryRenderedFeatures({
				layers: ['devices-clusters-layer'],
			})
			const nextVisibleClusterIds = new Set<string>()

			for (const feature of renderedClusters) {
				const props = feature.properties
				if (!props?.cluster) continue

				const id = String(props.cluster_id)
				if (nextVisibleClusterIds.has(id)) continue

				const coordinates = (feature.geometry as Point).coordinates
				// Count or position changes require a fresh SVG donut.
				const signature = [
					props.point_count,
					props.active,
					props.inactive,
					props.old,
					coordinates[0],
					coordinates[1],
				].join(':')
				let record: ClusterMarkerRecord | undefined =
					clusterMarkersRef.current[id]

				if (record && record.signature !== signature) {
					record.marker.remove()
					delete clusterMarkersRef.current[id]
					record = undefined
				}

				if (!record) {
					record = {
						signature,
						marker: ClusterMarker({
							clusterFeature: feature as Feature<Point, any>,
							map,
						}),
					}
					clusterMarkersRef.current[id] = record
				}

				record.marker.setLngLat([coordinates[0], coordinates[1]])

				if (!visibleClusterIdsRef.current.has(id)) {
					record.marker.addTo(map)
				}

				nextVisibleClusterIds.add(id)
			}

			for (const id of visibleClusterIdsRef.current) {
				if (!nextVisibleClusterIds.has(id)) {
					clusterMarkersRef.current[id]?.marker.remove()
				}
			}

			visibleClusterIdsRef.current = nextVisibleClusterIds
		},
		[removeAllClusterMarkers, selectedPheno],
	)

	const handleMapData = useCallback(
		(e: MapSourceDataEvent | MapStyleDataEvent) => {
			if (e.dataType === 'source' && e.sourceId !== 'osem-devices') return

			// Source updates can create or remove clusters without a user move.
			updateClusterMarkers(e.target as MapInstance)
		},
		[updateClusterMarkers],
	)

	const handleMapMove = useCallback(
		(e: ViewStateChangeEvent) => {
			// Keep HTML markers aligned while MapLibre reclusters during movement.
			updateClusterMarkers(e.target)
		},
		[updateClusterMarkers],
	)

	useEffect(() => {
		if (selectedPheno) {
			removeAllClusterMarkers()
			return
		}

		const map = mapRef.current?.getMap()
		if (!map) return

		// Filters swap source data, so resync the rendered cluster markers.
		updateClusterMarkers(map as MapInstance)
	}, [
		filteredDevices,
		removeAllClusterMarkers,
		selectedPheno,
		updateClusterMarkers,
	])

	useEffect(() => removeAllClusterMarkers, [removeAllClusterMarkers])

	return (
		<div className="h-full w-full">
			<MapProvider>
				<Header devices={devices} />

				{selectedPheno && (
					<Legend
						title={selectedPheno.label.item[0].text}
						values={legendLabels()}
					/>
				)}

				<Map
					interactiveLayerIds={
						selectedPheno
							? ['phenomenon-layer']
							: ['devices-symbol-layer', 'devices-clusters-layer']
					}
					onClick={onMapClick}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					onLoad={handleMapLoad}
					onData={handleMapData}
					onMove={handleMapMove}
					onMoveEnd={handleMapMove}
					ref={mapRef}
					initialViewState={
						deviceId
							? { latitude: deviceLoc[0], longitude: deviceLoc[1], zoom: 10 }
							: { latitude: 7, longitude: 52, zoom: 2 }
					}
				>
					{!selectedPheno && (
						<Source
							id="osem-devices"
							type="geojson"
							data={filteredDevices as FeatureCollection<Point, Device>}
							promoteId="id"
							cluster={true}
							clusterRadius={64} // 1/8 of a tile
							clusterProperties={{
								active: [
									'+',
									['case', ['==', ['get', 'status'], 'active'], 1, 0],
								],
								inactive: [
									'+',
									['case', ['==', ['get', 'status'], 'inactive'], 1, 0],
								],
								old: ['+', ['case', ['==', ['get', 'status'], 'old'], 1, 0]],
							}}
							clusterMinPoints={5}
						>
							<Layer
								type="circle"
								id="devices-clusters-layer"
								source="osem-clusters"
								filter={['has', 'point_count']}
								paint={{
									'circle-radius': [
										'case',
										['>=', ['get', 'point_count'], 1000],
										25,
										['>=', ['get', 'point_count'], 100],
										14,
										10,
									],
									'circle-color': 'transparent',
									'circle-stroke-width': 0,
								}}
							/>
							<Layer
								type="symbol"
								id="devices-symbol-layer"
								source="osem-devices"
								filter={deviceLayerFilter}
								layout={{
									'icon-image': [
										'case',
										['==', ['get', 'status'], 'active'],
										[
											'case',
											['==', ['get', 'exposure'], 'mobile'],
											'osem-mobile-active',
											'osem-device-active',
										],
										['==', ['get', 'status'], 'inactive'],
										[
											'case',
											['==', ['get', 'exposure'], 'mobile'],
											'osem-mobile-inactive',
											'osem-device-inactive',
										],
										[
											'case',
											['==', ['get', 'exposure'], 'mobile'],
											'osem-mobile-old',
											'osem-device-old',
										],
									],
									'icon-size': 1,
									'icon-allow-overlap': true,
								}}
								paint={{
									'icon-opacity': [
										'case',
										['boolean', ['feature-state', 'hover'], false],
										1,
										0.9,
									],
								}}
							/>
						</Source>
					)}

					{selectedPheno && (
						<Source
							id="osem-data"
							type="geojson"
							data={filteredData as FeatureCollection<Point, Device>}
							cluster={false}
						>
							<Layer
								{...(phenomenonLayers[selectedPheno.slug] ??
									buildLayerFromPheno())}
							/>
						</Source>
					)}

					{selectedDevice && deviceId && (
						<BoxMarker
							key={`device-${selectedDevice.properties.id}`}
							longitude={selectedDevice.geometry.coordinates[0]}
							latitude={selectedDevice.geometry.coordinates[1]}
							device={selectedDevice.properties as Device}
						/>
					)}

					<div className="pointer-events-none absolute inset-0 z-10">
						<div className="pointer-events-auto">
							<Outlet />
						</div>
					</div>
				</Map>
			</MapProvider>
		</div>
	)
}
