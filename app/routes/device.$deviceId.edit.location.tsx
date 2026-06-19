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
	LOCATION_PRIVACY_RADIUS_VALUES,
	isValidLocation,
	parseLocationFormData,
	parseLocationPrivacyFormData,
	validateLocationFieldErrors,
	type LocationData,
	type LocationFieldErrors,
	type LocationPrivacyData,
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

function normalizeCoordinate(value: number | null) {
	if (value === null) return null

	return Number(value.toFixed(6))
}

function normalizeLocationValues(values: MarkerValue) {
	return {
		latitude: normalizeCoordinate(values.latitude),
		longitude: normalizeCoordinate(values.longitude),
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
			locationPrivacy: LocationPrivacyData
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
	locationPrivacy: LocationPrivacyData['locationPrivacy']
	locationPrivacyRadiusMeters: LocationPrivacyData['locationPrivacyRadiusMeters']
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
	const privacyParsed = parseLocationPrivacyFormData(formData)

	if (!parsed.success || !privacyParsed.success) {
		return data(
			{
				ok: false as const,
				errors: {
					...(parsed.success ? {} : parsed.errors),
					...(privacyParsed.success ? {} : privacyParsed.errors),
				},
			},
			{ status: 400 },
		)
	}

	await updateDeviceLocation({
		id,
		latitude: parsed.data.latitude,
		longitude: parsed.data.longitude,
		locationPrivacy: privacyParsed.data.locationPrivacy,
		locationPrivacyRadiusMeters: privacyParsed.data.locationPrivacyRadiusMeters,
	})

	return data({
		ok: true as const,
		location: parsed.data,
		locationPrivacy: privacyParsed.data,
		errors: null,
		savedAt: new Date().toISOString(),
	})
}

//**********************************
export default function EditLocation() {
	const { device } = useLoaderData<typeof loader>()
	const { t } = useTranslation('edit-device-general')

	const initialLocation = useMemo<LocationData>(
		() => ({
			latitude: device.latitude,
			longitude: device.longitude,
		}),
		[device.latitude, device.longitude],
	)
	const initialLocationPrivacy = useMemo<LocationPrivacyData>(
		() => ({
			locationPrivacy: device.locationPrivacy === 'masked' ? 'masked' : 'exact',
			locationPrivacyRadiusMeters:
				device.locationPrivacyRadiusMeters &&
				LOCATION_PRIVACY_RADIUS_VALUES.includes(
					device.locationPrivacyRadiusMeters as (typeof LOCATION_PRIVACY_RADIUS_VALUES)[number],
				)
					? (device.locationPrivacyRadiusMeters as LocationPrivacyData['locationPrivacyRadiusMeters'])
					: 500,
		}),
		[device.locationPrivacy, device.locationPrivacyRadiusMeters],
	)

	const [marker, setMarker] = useState<MarkerValue>(initialLocation)
	const [locationPrivacy, setLocationPrivacy] = useState<
		LocationPrivacyData['locationPrivacy']
	>(initialLocationPrivacy.locationPrivacy)
	const [locationPrivacyRadiusMeters, setLocationPrivacyRadiusMeters] =
		useState<LocationPrivacyData['locationPrivacyRadiusMeters']>(
			initialLocationPrivacy.locationPrivacyRadiusMeters,
		)

	const currentLocation = useMemo<LocationData | null>(() => {
		const candidate = {
			latitude: marker.latitude,
			longitude: marker.longitude,
		}

		return isValidLocation(candidate) ? candidate : null
	}, [marker.latitude, marker.longitude])

	const originalLocationRef = useRef<LocationData>({
		latitude: device.latitude,
		longitude: device.longitude,
	})

	const originalLocation = originalLocationRef.current

	const validateAutosave = useCallback((values: LocationAutosaveValues) => {
		return isValidLocation(values)
	}, [])

	const getAutosavePayload = useCallback((values: LocationAutosaveValues) => {
		return {
			latitude: String(values.latitude),
			longitude: String(values.longitude),
			locationPrivacy: values.locationPrivacy,
			locationPrivacyRadiusMeters: String(values.locationPrivacyRadiusMeters),
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

			return {
				...normalizeLocationValues(submittedValues),
				locationPrivacy: actionData.locationPrivacy.locationPrivacy,
				locationPrivacyRadiusMeters:
					actionData.locationPrivacy.locationPrivacyRadiusMeters,
			}
		},
		[],
	)

	const autosaveValues = useMemo<LocationAutosaveValues>(
		() =>
			({
				...normalizeLocationValues({
					latitude: marker.latitude,
					longitude: marker.longitude,
				}),
				locationPrivacy,
				locationPrivacyRadiusMeters,
			}) as LocationAutosaveValues,
		[
			marker.latitude,
			marker.longitude,
			locationPrivacy,
			locationPrivacyRadiusMeters,
		],
	)

	const initialAutosaveValues = useMemo<LocationAutosaveValues>(
		() =>
			({
				...normalizeLocationValues(initialLocation),
				...initialLocationPrivacy,
			}) as LocationAutosaveValues,
		[initialLocation, initialLocationPrivacy],
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

	const clientErrors = validateLocationFieldErrors(marker)

	const serverErrors: LocationFieldErrors =
		autosave.status === 'error' && autosave.fetcher.data?.ok === false
			? autosave.fetcher.data.errors
			: {}

	const locationErrors = {
		latitude: clientErrors.latitude ?? serverErrors.latitude,
		longitude: clientErrors.longitude ?? serverErrors.longitude,
		locationPrivacy: serverErrors.locationPrivacy,
		locationPrivacyRadiusMeters: serverErrors.locationPrivacyRadiusMeters,
	}

	const hasClientErrors = Boolean(
		clientErrors.latitude || clientErrors.longitude,
	)

	const lastSavedLocation = autosave.lastSavedRef.current

	const mapLocation = currentLocation ?? {
		latitude: lastSavedLocation.latitude ?? initialLocation.latitude,
		longitude: lastSavedLocation.longitude ?? initialLocation.longitude,
	}

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

	const onLocationPrivacyChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setLocationPrivacy(event.target.value === 'masked' ? 'masked' : 'exact')
	}

	const onLocationPrivacyRadiusChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const radius = Number(event.target.value)

		if (
			LOCATION_PRIVACY_RADIUS_VALUES.includes(
				radius as (typeof LOCATION_PRIVACY_RADIUS_VALUES)[number],
			)
		) {
			setLocationPrivacyRadiusMeters(
				radius as LocationPrivacyData['locationPrivacyRadiusMeters'],
			)
		}
	}

	const resetToOriginalLocation = () => {
		setMarker({ ...originalLocation })
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
						<div className="grid gap-5 md:grid-cols-2">
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
						</div>

						<div className="mt-6 border-t border-gray-200 pt-5">
							<fieldset>
								<legend className="txt-base block font-bold tracking-normal">
									Public location
								</legend>

								<div className="mt-3 grid gap-3 md:grid-cols-2">
									<label className="flex cursor-pointer gap-3 rounded border border-gray-200 p-3">
										<input
											type="radio"
											name="locationPrivacy"
											value="exact"
											checked={locationPrivacy === 'exact'}
											onChange={onLocationPrivacyChange}
											className="mt-1"
										/>
										<span>
											<span className="block font-semibold">
												Show exact location
											</span>
											<span className="mt-1 block text-sm text-gray-600">
												Public API responses and maps use this coordinate.
											</span>
										</span>
									</label>

									<label className="flex cursor-pointer gap-3 rounded border border-gray-200 p-3">
										<input
											type="radio"
											name="locationPrivacy"
											value="masked"
											checked={locationPrivacy === 'masked'}
											onChange={onLocationPrivacyChange}
											className="mt-1"
										/>
										<span>
											<span className="block font-semibold">
												Show approximate location
											</span>
											<span className="mt-1 block text-sm text-gray-600">
												Public responses use a stable masked point nearby.
											</span>
										</span>
									</label>
								</div>
							</fieldset>

							<div className="mt-4 max-w-xs">
								<label
									htmlFor="locationPrivacyRadiusMeters"
									className="txt-base block font-bold tracking-normal"
								>
									Approximation radius
								</label>

								<select
									id="locationPrivacyRadiusMeters"
									name="locationPrivacyRadiusMeters"
									value={locationPrivacyRadiusMeters}
									onChange={onLocationPrivacyRadiusChange}
									disabled={locationPrivacy !== 'masked'}
									aria-describedby="location-privacy-radius-error"
									className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-base disabled:bg-gray-100 disabled:text-gray-500"
								>
									{LOCATION_PRIVACY_RADIUS_VALUES.map((radius) => (
										<option key={radius} value={radius}>
											{radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
										</option>
									))}
								</select>

								{locationErrors.locationPrivacy ||
								locationErrors.locationPrivacyRadiusMeters ? (
									<p
										id="location-privacy-radius-error"
										className="mt-1 text-sm text-red-600"
									>
										{locationErrors.locationPrivacy ??
											locationErrors.locationPrivacyRadiusMeters}
									</p>
								) : null}
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
