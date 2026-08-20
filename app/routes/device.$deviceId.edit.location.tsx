import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	type MarkerDragEvent,
	MapProvider,
	Marker,
	NavigationControl,
} from 'react-map-gl/maplibre'
import { data, redirect, useLoaderData } from 'react-router'

import invariant from 'tiny-invariant'
import { type Route } from './+types/device.$deviceId.edit.location'
import {
	getDeviceWithoutSensors,
	updateDeviceLocation,
} from '~/db/models/device.server'
import { getUserId } from '~/services/session-service.server'
import { BaseMap } from '~/components/base-map'
import {
	LOCATION_LIMITS,
	isValidLocation,
	parseDeviceLocationInputFormData,
	validateDeviceLocationInputFieldErrors,
	type DeviceLocationInputFieldErrors,
	type LocationCoordinates,
} from '~/lib/location'
import { useTranslation } from 'react-i18next'
import {
	useAutosaveFetcher,
	AUTOSAVE_DELAY_MS,
} from '~/hooks/use-autosave-fetcher'
import { AutosaveStatusText } from '~/components/autosave-status.text'
import Spinner from '~/components/spinner'
import { useTerrainElevation } from '~/hooks/use-terrain-elevation'
import {
	calculateHeightAboveSeaLevel,
	type TerrainElevationResult,
} from '~/lib/elevation'
import {
	ElevationLookupError,
	getTerrainElevation,
} from '~/services/elevation-service.server'

function parseNumberInput(value: string): number | null {
	if (value.trim() === '') return null

	const parsed = Number(value)

	if (!Number.isFinite(parsed)) return null

	return parsed
}

function parseHeightInput(value: string): number | null | undefined {
	if (value.trim() === '') return null

	const parsed = Number(value)

	return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeCoordinate(value: number | null) {
	if (value === null) return null

	return Number(value.toFixed(6))
}

function normalizeLocationValues(values: LocationAutosaveValues) {
	return {
		latitude: normalizeCoordinate(values.latitude),
		longitude: normalizeCoordinate(values.longitude),
		heightAboveGround: values.heightAboveGround,
	}
}

type MarkerValue = {
	latitude: number | null
	longitude: number | null
}

export type LocationActionData =
	| {
			ok: true
			location: StoredDeviceLocation
			heightAboveGround: number | null
			terrainElevation: TerrainElevationResult
			errors: null
			savedAt: string
	  }
	| {
			ok: false
			errors: DeviceLocationInputFieldErrors
	  }

type LocationAutosaveValues = {
	latitude: number | null
	longitude: number | null
	heightAboveGround: number | null | undefined
}

type InitialLocationValues = LocationAutosaveValues & {
	latitude: number
	longitude: number
}

type StoredDeviceLocation = LocationCoordinates & {
	height: number
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

	const parsed = parseDeviceLocationInputFormData(formData)

	if (!parsed.success) {
		return data(
			{
				ok: false as const,
				errors: parsed.errors,
			},
			{ status: 400 },
		)
	}

	let terrainElevation: TerrainElevationResult

	try {
		terrainElevation = await getTerrainElevation(
			parsed.data.latitude,
			parsed.data.longitude,
		)
	} catch (error) {
		console.warn(
			'Could not calculate device height above sea level:',
			error instanceof ElevationLookupError ? error.code : error,
		)

		return data(
			{
				ok: false as const,
				errors: {
					elevation: 'elevation_save_error',
				},
			},
			{ status: 503 },
		)
	}

	const finalHeight = calculateHeightAboveSeaLevel(
		terrainElevation.elevation,
		parsed.data.heightAboveGround,
	)

	await updateDeviceLocation({
		id,
		latitude: parsed.data.latitude,
		longitude: parsed.data.longitude,
		height: finalHeight,
	})

	return data({
		ok: true as const,
		location: {
			latitude: parsed.data.latitude,
			longitude: parsed.data.longitude,
			height: finalHeight,
		},
		heightAboveGround: parsed.data.heightAboveGround ?? null,
		terrainElevation,
		errors: null,
		savedAt: new Date().toISOString(),
	})
}

//**********************************
export default function EditLocation() {
	const { device } = useLoaderData<typeof loader>()
	const { t } = useTranslation('edit-device-general')
	const initialHeightAboveGround = device.height === null ? null : undefined

	const initialLocation = useMemo<InitialLocationValues>(
		() => ({
			latitude: device.latitude,
			longitude: device.longitude,
			heightAboveGround: initialHeightAboveGround,
		}),
		[device.latitude, device.longitude, initialHeightAboveGround],
	)

	const [marker, setMarker] = useState<MarkerValue>({
		latitude: initialLocation.latitude,
		longitude: initialLocation.longitude,
	})
	const [heightAboveGroundInput, setHeightAboveGroundInput] = useState(
		initialHeightAboveGround == null ? '' : String(initialHeightAboveGround),
	)
	const [heightInputReady, setHeightInputReady] = useState(
		initialHeightAboveGround !== undefined,
	)
	const parsedHeightAboveGround = useMemo(
		() => parseHeightInput(heightAboveGroundInput),
		[heightAboveGroundInput],
	)

	const currentLocation = useMemo<LocationCoordinates | null>(() => {
		const candidate = {
			latitude: marker.latitude,
			longitude: marker.longitude,
		}

		return isValidLocation(candidate) ? candidate : null
	}, [marker.latitude, marker.longitude])
	const originalElevation = useTerrainElevation({
		latitude: device.latitude,
		longitude: device.longitude,
	})
	const elevation = useTerrainElevation({
		latitude: currentLocation?.latitude,
		longitude: currentLocation?.longitude,
	})

	const originalLocationRef = useRef<LocationAutosaveValues>({
		latitude: device.latitude,
		longitude: device.longitude,
		heightAboveGround: initialHeightAboveGround,
	})

	const originalLocation = originalLocationRef.current

	const validateAutosave = useCallback((values: LocationAutosaveValues) => {
		if (values.heightAboveGround === undefined) return false

		const errors = validateDeviceLocationInputFieldErrors(values)

		return !(errors.latitude || errors.longitude || errors.heightAboveGround)
	}, [])

	const getAutosavePayload = useCallback((values: LocationAutosaveValues) => {
		return {
			latitude: String(values.latitude),
			longitude: String(values.longitude),
			heightAboveGround:
				values.heightAboveGround == null
					? ''
					: String(values.heightAboveGround),
		}
	}, [])

	const isAutosaveSuccess = useCallback((actionData: LocationActionData) => {
		return actionData.ok
	}, [])

	const getSavedValues = useCallback(
		(
			actionData: LocationActionData,
			submittedValues: LocationAutosaveValues,
		): LocationAutosaveValues => {
			if (!actionData.ok) return submittedValues

			return normalizeLocationValues(submittedValues)
		},
		[],
	)

	const autosaveValues = useMemo<LocationAutosaveValues>(
		() =>
			normalizeLocationValues({
				latitude: marker.latitude,
				longitude: marker.longitude,
				heightAboveGround: parsedHeightAboveGround,
			}),
		[marker.latitude, marker.longitude, parsedHeightAboveGround],
	)

	const initialAutosaveValues = useMemo<LocationAutosaveValues>(
		() => normalizeLocationValues(initialLocation),
		[initialLocation],
	)

	const autosave = useAutosaveFetcher<
		LocationAutosaveValues,
		LocationActionData
	>({
		values: autosaveValues,
		lastSavedValues: initialAutosaveValues,
		debounceMs: AUTOSAVE_DELAY_MS,
		enabled: heightInputReady && elevation.status === 'success',
		validate: validateAutosave,
		getPayload: getAutosavePayload,
		isSuccess: isAutosaveSuccess,
		getSavedValues,
	})
	const resetLastSaved = autosave.resetLastSaved

	useEffect(() => {
		if (heightInputReady || device.height === null || !originalElevation.result)
			return

		const derivedHeight = Number(
			(device.height - originalElevation.result.elevation).toFixed(3),
		)
		const originalValues = normalizeLocationValues({
			latitude: device.latitude,
			longitude: device.longitude,
			heightAboveGround: derivedHeight,
		})

		setHeightAboveGroundInput(String(derivedHeight))
		setHeightInputReady(true)
		originalLocationRef.current = originalValues
		resetLastSaved(originalValues)
	}, [
		device.height,
		device.latitude,
		device.longitude,
		heightInputReady,
		originalElevation.result,
		resetLastSaved,
	])

	const clientErrors = validateDeviceLocationInputFieldErrors({
		...marker,
		heightAboveGround:
			parsedHeightAboveGround === undefined
				? Number.NaN
				: parsedHeightAboveGround,
	})

	const serverErrors: DeviceLocationInputFieldErrors =
		autosave.status === 'error' && autosave.fetcher.data?.ok === false
			? autosave.fetcher.data.errors
			: {}

	const locationErrors = {
		latitude: clientErrors.latitude ?? serverErrors.latitude,
		longitude: clientErrors.longitude ?? serverErrors.longitude,
		heightAboveGround:
			clientErrors.heightAboveGround ?? serverErrors.heightAboveGround,
		elevation: serverErrors.elevation,
	}

	const hasClientErrors = Boolean(
		clientErrors.latitude ||
		clientErrors.longitude ||
		clientErrors.heightAboveGround,
	)

	const lastSavedLocation = autosave.lastSavedRef.current

	const mapLocation = currentLocation ?? {
		latitude: lastSavedLocation.latitude ?? initialLocation.latitude,
		longitude: lastSavedLocation.longitude ?? initialLocation.longitude,
	}

	const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
		setMarker((current) => ({
			...current,
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
		}))
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

	const onHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setHeightAboveGroundInput(event.target.value)
	}

	const resetToOriginalLocation = () => {
		setMarker({
			latitude: originalLocation.latitude,
			longitude: originalLocation.longitude,
		})
		setHeightAboveGroundInput(
			originalLocation.heightAboveGround == null
				? ''
				: String(originalLocation.heightAboveGround),
		)
	}

	const finalHeight =
		elevation.result && parsedHeightAboveGround !== undefined
			? calculateHeightAboveSeaLevel(
					elevation.result.elevation,
					parsedHeightAboveGround,
				)
			: null

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="font-helvetica mx-auto w-full text-[14px]">
					<div>
						<div className="mt-2 flex justify-between">
							<div>
								<h1 className="text-4xl">{t('exposure')}</h1>

								<AutosaveStatusText
									status={autosave.status}
									hasValidationErrors={hasClientErrors}
									namespace="edit-device-general"
								/>
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
										anchor="center"
										draggable
										onDragEnd={onMarkerDragEnd}
									/>
								) : null}

								<NavigationControl position="top-left" showCompass={false} />
							</BaseMap>
						</MapProvider>
					</div>

					<div className="mx-5 mt-5">
						<div className="grid gap-5 md:grid-cols-3">
							<div>
								<label
									htmlFor="latitude"
									className="txt-base block font-bold tracking-normal"
								>
									{t('latitude')}
								</label>

								<div className="mt-1">
									<input
										id="latitude"
										required
										autoFocus={true}
										name="latitude"
										type="number"
										step="any"
										min={LOCATION_LIMITS.latitude.min}
										max={LOCATION_LIMITS.latitude.max}
										value={marker.latitude ?? ''}
										onChange={onLatitudeChange}
										aria-describedby="latitude-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(locationErrors.latitude
												? ' border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow-sm focus:shadow-[#FF0000]'
												: '')
										}
									/>

									{locationErrors.latitude ? (
										<p
											id="latitude-error"
											className="mt-1 text-sm text-red-600"
										>
											{locationErrors.latitude}
										</p>
									) : null}
								</div>
							</div>

							<div>
								<label
									htmlFor="longitude"
									className="txt-base block font-bold tracking-normal"
								>
									{t('longitude')}
								</label>

								<div className="mt-1">
									<input
										id="longitude"
										required
										name="longitude"
										type="number"
										step="any"
										min={LOCATION_LIMITS.longitude.min}
										max={LOCATION_LIMITS.longitude.max}
										value={marker.longitude ?? ''}
										onChange={onLongitudeChange}
										aria-describedby="longitude-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(locationErrors.longitude
												? ' border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow-sm focus:shadow-[#FF0000]'
												: '')
										}
									/>

									{locationErrors.longitude ? (
										<p
											id="longitude-error"
											className="mt-1 text-sm text-red-600"
										>
											{locationErrors.longitude}
										</p>
									) : null}
								</div>
							</div>

							<div>
								<label
									htmlFor="heightAboveGround"
									className="txt-base block font-bold tracking-normal"
								>
									{t('height_above_ground')} ({t('optional')})
								</label>

								<div className="mt-1">
									<input
										id="heightAboveGround"
										name="heightAboveGround"
										type="number"
										inputMode="decimal"
										disabled={!heightInputReady}
										value={heightAboveGroundInput}
										onChange={onHeightChange}
										placeholder={t('enter_height_above_ground')}
										aria-describedby="height-info height-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(locationErrors.heightAboveGround
												? ' border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow-sm focus:shadow-[#FF0000]'
												: '')
										}
									/>

									<p
										id="height-info"
										className="text-muted-foreground mt-1 text-xs"
									>
										{t('height_info_text')}
									</p>

									{!heightInputReady && originalElevation.status === 'error' ? (
										<div className="mt-2 text-sm text-amber-600">
											<p>{t('elevation_error')}</p>
											<button
												type="button"
												onClick={originalElevation.retry}
												className="font-semibold underline"
											>
												{t('retry_elevation')}
											</button>
										</div>
									) : !heightInputReady ? (
										<div className="mt-2 flex items-center gap-2">
											<div className="h-4 w-4">
												<Spinner />
											</div>
											<span className="text-muted-foreground text-sm">
												{t('calculating_height_above_ground')}
											</span>
										</div>
									) : elevation.status === 'loading' ? (
										<div className="mt-2 flex items-center gap-2">
											<div className="h-4 w-4">
												<Spinner />
											</div>
											<span className="text-muted-foreground text-sm">
												{t('fetching_elevation')}
											</span>
										</div>
									) : elevation.status === 'error' ? (
										<div className="mt-2 text-sm text-amber-600">
											<p>{t('elevation_error')}</p>
											<button
												type="button"
												onClick={elevation.retry}
												className="font-semibold underline"
											>
												{t('retry_elevation')}
											</button>
										</div>
									) : elevation.result ? (
										<div className="text-muted-foreground mt-2 text-sm">
											<div>
												{t('terrain_elevation')}:{' '}
												{Math.round(elevation.result.elevation)} m
											</div>
											{finalHeight !== null ? (
												<div>
													{t('final_height')}: {Math.round(finalHeight)} m
												</div>
											) : null}
											<div className="text-xs">
												{t('elevation_source')}:{' '}
												{elevation.result.attribution ??
													elevation.result.dataset}
												{elevation.result.datum
													? ` (${elevation.result.datum})`
													: ''}
											</div>
										</div>
									) : null}

									{locationErrors.heightAboveGround ? (
										<p id="height-error" className="mt-1 text-sm text-red-600">
											{locationErrors.heightAboveGround}
										</p>
									) : null}

									{locationErrors.elevation ? (
										<p className="mt-1 text-sm text-red-600">
											{t(locationErrors.elevation)}
										</p>
									) : null}
								</div>
							</div>
						</div>

						<button
							type="button"
							onClick={resetToOriginalLocation}
							className="mt-4 mb-10 font-semibold text-blue-500 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
						>
							{t('reset_to_original_location')}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
