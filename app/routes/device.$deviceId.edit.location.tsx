import React, { useCallback, useMemo, useRef, useState } from 'react'
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
	parseLocationFormData,
	validateLocationFieldErrors,
	type LocationData,
	type LocationFieldErrors,
} from '~/lib/location'
import { useTranslation } from 'react-i18next'
import {
	useAutosaveFetcher,
	AUTOSAVE_DELAY_MS,
} from '~/hooks/use-autosave-fetcher'
import { AutosaveStatusText } from '~/components/autosave-status.text'

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
		height: values.height,
	}
}

type MarkerValue = {
	latitude: number | null
	longitude: number | null
}

export type LocationActionData =
	| {
			ok: true
			location: LocationData
			errors: null
			savedAt: string
	  }
	| {
			ok: false
			errors: LocationFieldErrors
	  }

type LocationAutosaveValues = {
	latitude: number | null
	longitude: number | null
	height: number | null | undefined
}

type InitialLocationValues = LocationAutosaveValues & {
	latitude: number
	longitude: number
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

	const parsed = parseLocationFormData(formData)

	if (!parsed.success) {
		return data(
			{
				ok: false as const,
				errors: parsed.errors,
			},
			{ status: 400 },
		)
	}

	await updateDeviceLocation({
		id,
		latitude: parsed.data.latitude,
		longitude: parsed.data.longitude,
		height: parsed.data.height ?? null,
	})

	return data({
		ok: true as const,
		location: parsed.data,
		errors: null,
		savedAt: new Date().toISOString(),
	})
}

//**********************************
export default function EditLocation() {
	const { device } = useLoaderData<typeof loader>()
	const { t } = useTranslation('edit-device-general')

	const initialLocation = useMemo<InitialLocationValues>(
		() => ({
			latitude: device.latitude,
			longitude: device.longitude,
			height: device.height ?? null,
		}),
		[device.latitude, device.longitude, device.height],
	)

	const [marker, setMarker] = useState<MarkerValue>({
		latitude: initialLocation.latitude,
		longitude: initialLocation.longitude,
	})
	const [heightInput, setHeightInput] = useState(
		initialLocation.height == null ? '' : String(initialLocation.height),
	)
	const parsedHeight = useMemo(
		() => parseHeightInput(heightInput),
		[heightInput],
	)

	const currentLocation = useMemo<LocationData | null>(() => {
		const candidate = {
			latitude: marker.latitude,
			longitude: marker.longitude,
		}

		return isValidLocation(candidate) ? candidate : null
	}, [marker.latitude, marker.longitude])

	const originalLocationRef = useRef<LocationAutosaveValues>({
		latitude: device.latitude,
		longitude: device.longitude,
		height: device.height ?? null,
	})

	const originalLocation = originalLocationRef.current

	const validateAutosave = useCallback((values: LocationAutosaveValues) => {
		return values.height !== undefined && isValidLocation(values)
	}, [])

	const getAutosavePayload = useCallback((values: LocationAutosaveValues) => {
		return {
			latitude: String(values.latitude),
			longitude: String(values.longitude),
			height: values.height == null ? '' : String(values.height),
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
				height: parsedHeight,
			}),
		[marker.latitude, marker.longitude, parsedHeight],
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
		validate: validateAutosave,
		getPayload: getAutosavePayload,
		isSuccess: isAutosaveSuccess,
		getSavedValues,
	})

	const clientErrors = validateLocationFieldErrors({
		...marker,
		height: parsedHeight === undefined ? Number.NaN : parsedHeight,
	})

	const serverErrors: LocationFieldErrors =
		autosave.status === 'error' && autosave.fetcher.data?.ok === false
			? autosave.fetcher.data.errors
			: {}

	const locationErrors = {
		latitude: clientErrors.latitude ?? serverErrors.latitude,
		longitude: clientErrors.longitude ?? serverErrors.longitude,
		height: clientErrors.height ?? serverErrors.height,
	}

	const hasClientErrors = Boolean(
		clientErrors.latitude || clientErrors.longitude || clientErrors.height,
	)

	const lastSavedLocation = autosave.lastSavedRef.current

	const mapLocation = currentLocation ?? {
		latitude: lastSavedLocation.latitude ?? initialLocation.latitude,
		longitude: lastSavedLocation.longitude ?? initialLocation.longitude,
	}

	const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
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
		setHeightInput(event.target.value)
	}

	const resetToOriginalLocation = () => {
		setMarker({
			latitude: originalLocation.latitude,
			longitude: originalLocation.longitude,
		})
		setHeightInput(
			originalLocation.height == null ? '' : String(originalLocation.height),
		)
	}

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
										onDrag={onMarkerDrag}
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
									htmlFor="height"
									className="txt-base block font-bold tracking-normal"
								>
									{t('height')} ({t('optional')})
								</label>

								<div className="mt-1">
									<input
										id="height"
										name="height"
										type="text"
										inputMode="decimal"
										value={heightInput}
										onChange={onHeightChange}
										placeholder={t('enter_height')}
										aria-describedby="height-info height-error"
										className={
											'w-full rounded border border-gray-200 px-2 py-1 text-base' +
											(locationErrors.height
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

									{locationErrors.height ? (
										<p id="height-error" className="mt-1 text-sm text-red-600">
											{locationErrors.height}
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
