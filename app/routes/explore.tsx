/* eslint-disable @typescript-eslint/no-unused-vars */
import { type FeatureCollection, type Point } from 'geojson'
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
	type MapRef,
	MapProvider,
	Layer,
	Source,
	type MapInstance,
} from 'react-map-gl/maplibre'
import {
	useOutlet,
	useNavigate,
	useSearchParams,
	useLoaderData,
	useParams,
	useLocation,
} from 'react-router'
import { type Route } from './+types/explore'
import Map from '~/components/map'
import { phenomenonLayers, defaultLayer } from '~/components/map/layers'
import Legend, { type LegendValue } from '~/components/map/legend'
import {
	getDevices,
	getDevicesWithSensors,
	getUserDeviceLocations,
} from '~/db/models/device.server'
import { getMeasurement } from '~/db/models/measurement.query.server'
import { getProfileByUserId } from '~/db/models/profile.server'
import { getSensors } from '~/db/models/sensor.server'
import { type Device } from '~/db/schema'
import { getCSV, getJSON, getTXT } from '~/lib/file-exports'
import {
	getValidMapViewport,
	MAP_ZOOM_LIMITS,
	validLngLat,
	type MapViewport,
} from '~/lib/location'
import { getLocale } from '~/middleware/i18next'
import { getUser, getUserSession } from '~/services/session-service.server'
import { getFilteredDevices } from '~/utils'
import maplibregl, {
	type LngLatLike,
	type MapLayerMouseEvent,
	type MapLibreEvent,
	type MapLibreMap,
	type StyleImageMetadata,
	type FilterSpecification,
} from 'maplibre-gl'
import BoxMarker from '~/components/map/layers/cluster/box-marker'
import MapHeader from '~/components/map/topbar'
import { getMeasurementsCount } from '~/db/models/measurement.server'
import { getTags } from '~/services/device-service.server'
import { getPhenomena } from '~/db/models/phenomena.server'
import { DOWNLOAD_FILTER_KEYS } from '~/components/header/download'

const INITIAL_VIEW_STATE = {
	zoom: 2,
	latitude: 51.961563,
	longitude: 7.628202,
} as const

const MAX_MY_AREA_LATITUDE_SPAN = 35
const MAX_MY_AREA_LONGITUDE_SPAN = 60

type MyAreaTarget =
	| {
			type: 'view'
			view: MapViewport
	  }
	| {
			type: 'bounds'
			bounds: [[number, number], [number, number]]
	  }

type OwnedDeviceLocation = {
	id: string
	latitude: number
	longitude: number
}

function parseMapHash(hash: string) {
	const match = hash.match(
		/^#?(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/,
	)

	if (!match) return null

	const [, zoom, latitude, longitude] = match

	return getValidMapViewport({
		latitude: Number(latitude),
		longitude: Number(longitude),
		zoom: Number(zoom),
	})
}

function getHomeView(
	profile: Awaited<ReturnType<typeof getProfileByUserId>> | null,
) {
	if (!profile) return null

	return getValidMapViewport({
		latitude: profile.homeLatitude,
		longitude: profile.homeLongitude,
		zoom: profile.homeZoom,
	})
}

function getOwnedDevicesAreaTarget(
	devices: OwnedDeviceLocation[],
): MyAreaTarget | null {
	const validDevices = devices.filter(({ longitude, latitude }) =>
		validLngLat(longitude, latitude),
	)

	if (validDevices.length === 0) return null

	if (validDevices.length === 1) {
		const { longitude, latitude } = validDevices[0]

		return {
			type: 'view',
			view: {
				longitude,
				latitude,
				zoom: MAP_ZOOM_LIMITS.default,
			},
		}
	}

	const [firstDevice, ...remainingDevices] = validDevices
	let west = firstDevice.longitude
	let east = firstDevice.longitude
	let south = firstDevice.latitude
	let north = firstDevice.latitude

	for (const device of remainingDevices) {
		west = Math.min(west, device.longitude)
		east = Math.max(east, device.longitude)
		south = Math.min(south, device.latitude)
		north = Math.max(north, device.latitude)
	}

	const latitudeSpan = Math.abs(north - south)
	const longitudeSpan = Math.abs(east - west)

	if (
		latitudeSpan > MAX_MY_AREA_LATITUDE_SPAN ||
		longitudeSpan > MAX_MY_AREA_LONGITUDE_SPAN
	) {
		return null
	}

	return {
		type: 'bounds',
		bounds: [
			[west, south],
			[east, north],
		],
	}
}

function parseCsv(value: FormDataEntryValue | null): string[] {
	if (typeof value !== 'string') return []

	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function getDownloadFilterParams(formData: FormData) {
	const filterParams = new URLSearchParams()

	for (const key of DOWNLOAD_FILTER_KEYS) {
		const value = formData.get(key)

		if (typeof value === 'string' && value.length > 0) {
			filterParams.set(key, value)
		}
	}

	return filterParams
}

export async function action({ request }: { request: Request }) {
	const deviceLimit = 50
	const sensorIds: Array<string> = []
	const measurements: Array<object> = []

	const formdata = await request.formData()

	const deviceIds = parseCsv(formdata.get('devices'))
	const format = String(formdata.get('format') ?? 'csv')
	const aggregate = String(formdata.get('aggregate') ?? 'raw')

	const includeFields = {
		title: formdata.get('title') === 'on',
		unit: formdata.get('unit') === 'on',
		value: formdata.get('value') === 'on',
		timestamp: formdata.get('timestamp') === 'on',
	}

	const filterParams = getDownloadFilterParams(formdata)

	const selectedPhenomena = parseCsv(formdata.get('phenomenon')).map(
		(phenomenon) => phenomenon.toLowerCase(),
	)

	const measurementTimeRange =
		getMeasurementTimeRangeFromSearchParams(filterParams)

	if (deviceIds.length === 0) {
		return Response.json({
			error: 'No devices selected.',
		})
	}

	if (deviceIds.length >= deviceLimit) {
		return Response.json({
			error: 'error',
			link: 'https://archive.opensensemap.org/',
		})
	}

	for (const deviceId of deviceIds) {
		const sensors = await getSensors(deviceId)

		const filteredSensors =
			selectedPhenomena.length > 0
				? sensors.filter((sensor) =>
						selectedPhenomena.includes(sensor.title?.toLowerCase() ?? ''),
					)
				: sensors

		for (const sensor of filteredSensors) {
			sensorIds.push(sensor.id)

			const measurement = await getMeasurement(
				sensor.id,
				aggregate,
				measurementTimeRange?.from,
				measurementTimeRange?.to,
			)

			measurement.map((m: any) => {
				m.title = sensor.title
				m.unit = sensor.unit
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

export type MeasurementTimeRange = {
	from: Date
	to: Date
}

function startOfUtcDate(date: string) {
	const [year, month, day] = date.split('-').map(Number)
	return new Date(Date.UTC(year, month - 1, day))
}

function addUtcDays(date: Date, days: number) {
	const next = new Date(date)
	next.setUTCDate(next.getUTCDate() + days)
	return next
}

export function getMeasurementTimeRangeFromSearchParams(
	searchParams: URLSearchParams,
): MeasurementTimeRange | undefined {
	const timeMode = searchParams.get('timeMode')

	if (timeMode === 'pointintime') {
		const date = searchParams.get('date')

		if (!date) return undefined

		const from = startOfUtcDate(date)
		const to = addUtcDays(from, 1)

		return {
			from,
			to,
		}
	}

	if (timeMode === 'timeperiod') {
		const fromParam = searchParams.get('from')
		const toParam = searchParams.get('to')

		if (!fromParam || !toParam) return undefined

		const from = startOfUtcDate(fromParam)
		const to = addUtcDays(startOfUtcDate(toParam), 1)

		if (from > to) return undefined

		return {
			from,
			to,
		}
	}

	return undefined
}

export async function loader({ context, request }: Route.LoaderArgs) {
	//* Get filter params
	let locale = getLocale(context)
	const url = new URL(request.url)
	const filterParams = url.search
	const urlFilterParams = new URLSearchParams(url.search)

	const measurementTimeRange =
		getMeasurementTimeRangeFromSearchParams(urlFilterParams)

	// check if sensors are queried - if not get devices only to reduce load
	const needsSensors =
		Boolean(urlFilterParams.get('phenomenon')) || Boolean(measurementTimeRange)

	const devices = needsSensors
		? await getDevicesWithSensors({ measurementTimeRange })
		: await getDevices('geojson')

	const availableTags = await getTags()

	const measurementCount = await getMeasurementsCount()

	const session = await getUserSession(request)
	const message = session.get('global_message') || null

	var filteredDevices = getFilteredDevices(devices, urlFilterParams)

	const user = await getUser(request)
	const phenomena = await getPhenomena()

	if (user) {
		const [profile, userDeviceLocations] = await Promise.all([
			getProfileByUserId(user.id),
			getUserDeviceLocations(user.id),
		])
		const userLocale = user.language
			? user.language.split(/[_-]/)[0].toLowerCase()
			: 'en'

		return {
			devices,
			availableTags,
			phenomena,
			measurementCount,
			user,
			profile,
			userDeviceLocations,
			filteredDevices,
			filterParams,
			locale: userLocale,
		}
	}
	return {
		devices,
		availableTags,
		phenomena,
		measurementCount,
		user,
		profile: null,
		userDeviceLocations: [],
		filterParams,
		filteredDevices,
		message,
		locale,
	}
}

// This is for the live data display. The 21-06-2023 works with the seed Data, for Production take now minus 10 minutes
let currentDate = new Date('2023-06-21T14:13:11.024Z')
if (process.env.NODE_ENV === 'production') {
	currentDate = new Date(Date.now() - 1000 * 600)
}

export default function Explore() {
	// data from our loader
	const {
		devices,
		availableTags,
		filteredDevices,
		measurementCount,
		user,
		profile,
		userDeviceLocations,
	} = useLoaderData<typeof loader>()
	const mapRef = useRef<MapRef | null>(null)
	const appliedInitialMyAreaRef = useRef(false)
	const navigate = useNavigate()
	const location = useLocation()
	const outlet = useOutlet()
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
				offset: [15, -25],
				className: 'device-name-popup',
			}),
		[],
	)

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

	const flyToView = useCallback(
		(view: { zoom: number; latitude: number; longitude: number }) => {
			mapRef.current?.flyTo({
				center: [view.longitude, view.latitude],
				zoom: view.zoom,
				duration: 900,
				essential: true,
			})
		},
		[],
	)

	const flyToHash = useCallback(
		(hash: string) => {
			const view = parseMapHash(hash)

			if (!view) return

			flyToView(view)
		},
		[flyToView],
	)

	useEffect(() => {
		flyToHash(location.hash)
	}, [location.hash, flyToHash])

	const handleHomeClick = useCallback(() => {
		flyToView(INITIAL_VIEW_STATE)
	}, [flyToView])

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
					.setText(feature.properties.name ?? '')
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
	let selectedDevice: any
	if (deviceId) {
		selectedDevice = (devices as any).features.find(
			(device: any) => device.properties.id === deviceId,
		)
	}

	const selectedDeviceId = selectedDevice?.properties.id
	const selectedDeviceView = selectedDevice
		? {
				latitude: selectedDevice.properties.latitude,
				longitude: selectedDevice.properties.longitude,
				zoom: 10,
			}
		: null
	const hashView = parseMapHash(location.hash)
	const homeView = getHomeView(profile)
	const ownedDevicesAreaTarget = useMemo(
		() => getOwnedDevicesAreaTarget(userDeviceLocations),
		[userDeviceLocations],
	)
	const myAreaTarget = homeView
		? ({
				type: 'view',
				view: homeView,
			} satisfies MyAreaTarget)
		: ownedDevicesAreaTarget
	const initialViewState =
		selectedDeviceView ?? hashView ?? homeView ?? INITIAL_VIEW_STATE
	const shouldApplyInitialMyArea =
		!selectedDeviceView &&
		!hashView &&
		!homeView &&
		Boolean(ownedDevicesAreaTarget)

	const deviceLayerFilter: FilterSpecification = selectedDeviceId
		? [
				'all',
				['!', ['has', 'point_count']],
				['!=', ['get', 'id'], selectedDeviceId],
			]
		: ['!', ['has', 'point_count']]

	const focusMyArea = useCallback(
		(target: MyAreaTarget | null = myAreaTarget, animate = true) => {
			if (!target) return

			if (target.type === 'view') {
				mapRef.current?.flyTo({
					center: [target.view.longitude, target.view.latitude],
					zoom: target.view.zoom,
					duration: animate ? 900 : 0,
					essential: true,
				})
				return
			}

			mapRef.current?.fitBounds(target.bounds, {
				padding: 80,
				maxZoom: 12,
				duration: animate ? 900 : 0,
				essential: true,
			})
		},
		[myAreaTarget],
	)

	const buildLayerFromPheno = () => {
		//TODO: ADD VALUES TO DEFAULTLAYER FROM selectedPheno.ROV or min/max from values.
		return defaultLayer
	}

	const loadImageIfNotExists = async (
		map: MapLibreMap,
		id: string,
		url: string,
		options?: Partial<StyleImageMetadata>,
	) => {
		if (map.hasImage(id)) return

		const image = await map.loadImage(url)

		map.addImage(id, image.data, options)
	}

	const handleMapLoad = async (e: MapLibreEvent) => {
		const map = e.target
		const retinaImageOptions = { pixelRatio: 2 }
		await Promise.allSettled([
			loadImageIfNotExists(
				map,
				'osem-device-active',
				'/img/device_marker_active.png',
				retinaImageOptions,
			),
			loadImageIfNotExists(
				map,
				'osem-device-inactive',
				'/img/device_marker_inactive.png',
				retinaImageOptions,
			),
			loadImageIfNotExists(
				map,
				'osem-device-old',
				'/img/device_marker_old.png',
				retinaImageOptions,
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-active',
				'/img/mobile_marker_active.png',
				retinaImageOptions,
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-inactive',
				'/img/mobile_marker_inactive.png',
				retinaImageOptions,
			),
			loadImageIfNotExists(
				map,
				'osem-mobile-old',
				'/img/mobile_marker_old.png',
				retinaImageOptions,
			),
		])

		if (shouldApplyInitialMyArea && !appliedInitialMyAreaRef.current) {
			appliedInitialMyAreaRef.current = true
			focusMyArea(ownedDevicesAreaTarget, false)
		}
	}

	return (
		<div className="h-full w-full">
			<MapProvider>
				<MapHeader
					devices={filteredDevices}
					measurementCount={measurementCount}
					onHomeClick={handleHomeClick}
					onMyAreaClick={() => focusMyArea(myAreaTarget)}
					canFocusMyArea={Boolean(myAreaTarget)}
				/>
				{/* <Header devices={devices} /> */}
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
					ref={mapRef}
					initialViewState={initialViewState}
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
									'circle-stroke-width': [
										'case',
										['>=', ['get', 'point_count'], 1000],
										12,
										['>=', ['get', 'point_count'], 100],
										6,
										4,
									],
									'circle-stroke-color': '#4EAF47',
								}}
							/>
							<Layer
								type="symbol"
								id="cluster-count-layer"
								source="osem-devices"
								filter={['has', 'point_count']}
								layout={{
									'text-field': ['get', 'point_count'],
									'text-size': [
										'case',
										['>=', ['get', 'point_count'], 1000],
										14,
										['>=', ['get', 'point_count'], 100],
										12,
										10,
									],
								}}
								paint={{
									'text-color': '#000',
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
									'icon-anchor': 'bottom',
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

					{outlet && (
						<div className="pointer-events-none absolute inset-0 z-50">
							<div className="pointer-events-auto h-full w-full">{outlet}</div>
						</div>
					)}
				</Map>
			</MapProvider>
		</div>
	)
}
