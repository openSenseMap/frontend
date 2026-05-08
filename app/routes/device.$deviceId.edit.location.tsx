import { Save } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import {
	type MarkerDragEvent,
	MapProvider,
	Marker,
	NavigationControl,
} from 'react-map-gl/maplibre'
import { data, redirect, useFetcher, useLoaderData } from 'react-router'

import invariant from 'tiny-invariant'
import { type Route } from './+types/device.$deviceId.edit.location'
import {
	getDeviceWithoutSensors,
	updateDeviceLocation,
} from '~/db/models/device.server'
import { getUserId } from '~/services/session-service.server'
import { BaseMap } from '~/components/base-map'

const LATITUDE_MIN = -85.06
const LATITUDE_MAX = 85.06
const LONGITUDE_MIN = -180
const LONGITUDE_MAX = 180
const AUTOSAVE_DELAY_MS = 700

type LocationValue = {
	latitude: number
	longitude: number
}

type MarkerValue = {
	latitude: number | null
	longitude: number | null
}

function isValidLatitude(value: number | null): value is number {
	return (
		typeof value === 'number' &&
		Number.isFinite(value) &&
		value >= LATITUDE_MIN &&
		value <= LATITUDE_MAX
	)
}

function isValidLongitude(value: number | null): value is number {
	return (
		typeof value === 'number' &&
		Number.isFinite(value) &&
		value >= LONGITUDE_MIN &&
		value <= LONGITUDE_MAX
	)
}

function isValidLocation(value: MarkerValue): value is LocationValue {
	return isValidLatitude(value.latitude) && isValidLongitude(value.longitude)
}

function isSameLocation(a: LocationValue, b: LocationValue) {
	return a.latitude === b.latitude && a.longitude === b.longitude
}

function parseNumberInput(value: string): number | null {
	if (value.trim() === '') return null

	const parsed = Number(value)

	if (!Number.isFinite(parsed)) return null

	return parsed
}

//*****************************************************
export async function loader({ request, params }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId
	invariant(typeof deviceID === 'string', 'Device id not found.')

	const deviceData = await getDeviceWithoutSensors({ id: deviceID })

	if (!deviceData) {
		throw new Response('Device not found', { status: 404 })
	}

	if (deviceData.userId !== userId) {
		throw new Response('Forbidden', { status: 403 })
	}

	return { device: deviceData }
}

//*****************************************************
export async function action({ request, params }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const id = params.deviceId
	invariant(typeof id === 'string', 'Device id not found.')

	const device = await getDeviceWithoutSensors({ id })

	if (!device) {
		throw new Response('Device not found', { status: 404 })
	}

	if (device.userId !== userId) {
		throw new Response('Forbidden', { status: 403 })
	}

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent !== 'autosaveLocation' && intent !== 'saveLocation') {
		return data(
			{
				ok: false as const,
				intent,
				errors: {
					form: 'Invalid action.',
				},
			},
			{ status: 400 },
		)
	}

	const latitudeRaw = formData.get('latitude')
	const longitudeRaw = formData.get('longitude')

	const latitude =
		typeof latitudeRaw === 'string' ? Number(latitudeRaw) : Number.NaN

	const longitude =
		typeof longitudeRaw === 'string' ? Number(longitudeRaw) : Number.NaN

	const errors: {
		latitude?: string
		longitude?: string
		form?: string
	} = {}

	if (
		!Number.isFinite(latitude) ||
		latitude < LATITUDE_MIN ||
		latitude > LATITUDE_MAX
	) {
		errors.latitude = `Latitude must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.`
	}

	if (
		!Number.isFinite(longitude) ||
		longitude < LONGITUDE_MIN ||
		longitude > LONGITUDE_MAX
	) {
		errors.longitude = `Longitude must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.`
	}

	if (Object.keys(errors).length > 0) {
		return data(
			{
				ok: false as const,
				intent,
				errors,
			},
			{ status: 400 },
		)
	}

	await updateDeviceLocation({
		id,
		latitude,
		longitude,
	})

	return data({
		ok: true as const,
		intent,
		location: {
			latitude,
			longitude,
		},
		errors: null,
		savedAt: new Date().toISOString(),
	})
}

//**********************************
export default function EditLocation() {
	const { device } = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof action>()

	const initialLocation = React.useMemo<LocationValue>(
		() => ({
			latitude: device.latitude,
			longitude: device.longitude,
		}),
		[device.latitude, device.longitude],
	)

	const [marker, setMarker] = useState<MarkerValue>(initialLocation)
	const [lastSavedLocation, setLastSavedLocation] =
		useState<LocationValue>(initialLocation)

	const currentLocation = React.useMemo<LocationValue | null>(() => {
		if (!isValidLocation(marker)) return null

		return {
			latitude: marker.latitude,
			longitude: marker.longitude,
		}
	}, [marker])

	const hasUnsavedChanges =
		currentLocation !== null &&
		!isSameLocation(currentLocation, lastSavedLocation)

	const isSaving = fetcher.state !== 'idle'

	const latitudeError =
		marker.latitude === null
			? 'Latitude is required.'
			: !isValidLatitude(marker.latitude)
				? `Latitude must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.`
				: fetcher.data?.ok === false
					// @ts-ignore
					? fetcher.data.errors.latitude
					: null

	const longitudeError =
		marker.longitude === null
			? 'Longitude is required.'
			: !isValidLongitude(marker.longitude)
				? `Longitude must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.`
				: fetcher.data?.ok === false
					// @ts-ignore
					? fetcher.data.errors.longitude
					: null

	const saveLocation = React.useCallback(
		(location: LocationValue, intent: 'autosaveLocation' | 'saveLocation') => {
			fetcher.submit(
				{
					intent,
					latitude: String(location.latitude),
					longitude: String(location.longitude),
				},
				{ method: 'post' },
			)
		},
		[fetcher],
	)

	React.useEffect(() => {
		if (!currentLocation) return
		if (!hasUnsavedChanges) return

		const timeout = window.setTimeout(() => {
			saveLocation(currentLocation, 'autosaveLocation')
		}, AUTOSAVE_DELAY_MS)

		return () => window.clearTimeout(timeout)
	}, [currentLocation, hasUnsavedChanges, saveLocation])

	React.useEffect(() => {
		if (fetcher.state !== 'idle') return
		if (!fetcher.data) return

		if (fetcher.data.ok) {
			setLastSavedLocation(fetcher.data.location)
		}
	}, [fetcher.state, fetcher.data])

	const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
		setMarker({
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
		})
	}, [])

	const onLatitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const latitude = parseNumberInput(event.target.value)

		setMarker((current) => ({
			...current,
			latitude,
		}))
	}

	const onLongitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const longitude = parseNumberInput(event.target.value)

		setMarker((current) => ({
			...current,
			longitude,
		}))
	}

	const resetToSavedLocation = () => {
		setMarker(lastSavedLocation)
	}

	const mapLocation = currentLocation ?? lastSavedLocation

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="font-helvetica mx-auto w-full text-[14px]">
					<div>
						<div className="mt-2 flex justify-between">
							<div>
								<h1 className="text-4xl">Location</h1>

								<div className="mt-2 min-h-5 text-sm">
									{isSaving ? (
										<p className="text-gray-500">Saving...</p>
									) : fetcher.data?.ok === false ? (
										<p className="text-red-600">
											Autosave failed. Your changes are still local.
										</p>
									) : hasUnsavedChanges ? (
										<p className="text-gray-500">Unsaved changes</p>
									) : (
										<p className="text-gray-500">Saved</p>
									)}
								</div>
							</div>

							<div>
								<button
									type="button"
									aria-label="Save location"
									disabled={!currentLocation || !hasUnsavedChanges || isSaving}
									onClick={() => {
										if (!currentLocation) return
										saveLocation(currentLocation, 'saveLocation')
									}}
									className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6] disabled:cursor-not-allowed disabled:bg-[#e9e9ed]"
								>
									<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
								</button>
							</div>
						</div>
					</div>

					<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

					<div className="mt-5">
						<MapProvider>
							<BaseMap
								initialViewState={{
									latitude: mapLocation.latitude,
									longitude: mapLocation.longitude,
									zoom: 10,
								}}
								style={{
									width: '100%',
									height: '500px',
									borderRadius: '6px',
								}}
							>
								{currentLocation ? (
									<Marker
										longitude={currentLocation.longitude}
										latitude={currentLocation.latitude}
										anchor="bottom"
										draggable
										onDrag={onMarkerDrag}
									/>
								) : null}

								<NavigationControl position="top-left" showCompass={false} />
							</BaseMap>
						</MapProvider>
					</div>

					<div className="mx-5 mt-5">
						<div className="grid gap-5 md:grid-cols-2">
							<div>
								<label
									htmlFor="latitude"
									className="txt-base block font-bold tracking-normal"
								>
									Latitude
								</label>

								<div className="mt-1">
									<input
										id="latitude"
										required
										autoFocus={true}
										name="latitude"
										type="number"
										min={LATITUDE_MIN}
										max={LATITUDE_MAX}
										value={marker.latitude ?? ''}
										onChange={onLatitudeChange}
										aria-describedby="latitude-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(latitudeError
												? ' border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow-sm focus:shadow-[#FF0000]'
												: '')
										}
									/>

									{latitudeError ? (
										<p id="latitude-error" className="mt-1 text-sm text-red-600">
											{latitudeError}
										</p>
									) : null}
								</div>
							</div>

							<div>
								<label
									htmlFor="longitude"
									className="txt-base block font-bold tracking-normal"
								>
									Longitude
								</label>

								<div className="mt-1">
									<input
										id="longitude"
										required
										name="longitude"
										type="number"
										min={LONGITUDE_MIN}
										max={LONGITUDE_MAX}
										value={marker.longitude ?? ''}
										onChange={onLongitudeChange}
										aria-describedby="longitude-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(longitudeError
												? ' border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow-sm focus:shadow-[#FF0000]'
												: '')
										}
									/>

									{longitudeError ? (
										<p id="longitude-error" className="mt-1 text-sm text-red-600">
											{longitudeError}
										</p>
									) : null}
								</div>
							</div>
						</div>

						<button
							type="button"
							onClick={resetToSavedLocation}
							disabled={!hasUnsavedChanges}
							className="mt-4 mb-10 font-semibold text-[#337ab7] hover:text-[#23527c] hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
						>
							Reset to saved location
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}