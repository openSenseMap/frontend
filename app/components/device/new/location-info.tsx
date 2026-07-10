import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
	GeolocateControl,
	Marker,
	NavigationControl,
	type MapRef,
	type MarkerDragEvent,
} from 'react-map-gl/maplibre'
import { Input } from '@/components/ui/input'
import { Label } from '~/components/ui/label'
import { BaseMap } from '~/components/base-map'
import {
	DEFAULT_LOCATION_PRIVACY_MIN_DISTANCE_METERS,
	DEFAULT_LOCATION_PRIVACY_RADIUS_METERS,
	LOCATION_LIMITS,
	LOCATION_PRIVACY_DISTANCE_PRESETS,
	isValidLocation,
	type LocationPrivacyData,
} from '~/lib/location'

export function LocationStep() {
	const mapRef = useRef<MapRef | null>(null)
	const {
		register,
		setValue,
		watch,
		formState: { errors },
	} = useFormContext()
	const { t } = useTranslation('newdevice')
	const savedLatitude = watch('latitude')
	const savedLongitude = watch('longitude')
	const locationPrivacy = watch('locationPrivacy') ?? 'masked'
	const locationPrivacyMinDistanceMeters =
		watch('locationPrivacyMinDistanceMeters') ??
		DEFAULT_LOCATION_PRIVACY_MIN_DISTANCE_METERS
	const locationPrivacyRadiusMeters =
		watch('locationPrivacyRadiusMeters') ??
		DEFAULT_LOCATION_PRIVACY_RADIUS_METERS

	const [marker, setMarker] = useState<{
		latitude: number | string
		longitude: number | string
	}>({
		latitude: savedLatitude || '',
		longitude: savedLongitude || '',
	})

	useEffect(() => {
		if (!locationPrivacy) {
			setValue('locationPrivacy', 'masked', { shouldValidate: true })
		}
		if (!locationPrivacyMinDistanceMeters) {
			setValue(
				'locationPrivacyMinDistanceMeters',
				DEFAULT_LOCATION_PRIVACY_MIN_DISTANCE_METERS,
				{
					shouldValidate: true,
				},
			)
		}
		if (!locationPrivacyRadiusMeters) {
			setValue(
				'locationPrivacyRadiusMeters',
				DEFAULT_LOCATION_PRIVACY_RADIUS_METERS,
				{ shouldValidate: true },
			)
		}
	}, [
		locationPrivacy,
		locationPrivacyMinDistanceMeters,
		locationPrivacyRadiusMeters,
		setValue,
	])

	useEffect(() => {
		if (savedLatitude !== undefined && savedLongitude !== undefined) {
			setMarker({
				latitude: savedLatitude,
				longitude: savedLongitude,
			})
		}
	}, [savedLatitude, savedLongitude])

	const onLocationPrivacyChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setValue(
			'locationPrivacy',
			event.target.value === 'exact' ? 'exact' : 'masked',
			{ shouldValidate: true },
		)
	}

	const onLocationPrivacyPresetChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const [minDistance, maxDistance] = event.target.value.split(':').map(Number)

		const preset = LOCATION_PRIVACY_DISTANCE_PRESETS.find(
			(candidate) =>
				candidate.min === minDistance && candidate.max === maxDistance,
		)

		if (!preset) return

		setValue(
			'locationPrivacyMinDistanceMeters',
			preset.min as LocationPrivacyData['locationPrivacyMinDistanceMeters'],
			{ shouldValidate: true },
		)
		setValue(
			'locationPrivacyRadiusMeters',
			preset.max as LocationPrivacyData['locationPrivacyRadiusMeters'],
			{ shouldValidate: true },
		)
	}

	const formatDistance = (meters: number) =>
		meters >= 1000 ? `${meters / 1000} km` : `${meters} m`

	const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.trim()
		const parsedValue = parseFloat(value)

		setMarker((prev) => ({
			...prev,
			latitude: value === '' || isNaN(parsedValue) ? '' : parsedValue,
		}))

		setValue(
			'latitude',
			value === '' || isNaN(parsedValue) ? undefined : parsedValue,
		)
	}

	const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.trim()
		const parsedValue = parseFloat(value)

		setMarker((prev) => ({
			...prev,
			longitude: value === '' || isNaN(parsedValue) ? '' : parsedValue,
		}))

		setValue(
			'longitude',
			value === '' || isNaN(parsedValue) ? undefined : parsedValue,
		)
	}

	const onMarkerDrag = useCallback(
		(event: MarkerDragEvent) => {
			const { lng, lat } = event.lngLat
			setMarker({
				latitude: Math.round(lat * 1000000) / 1000000,
				longitude: Math.round(lng * 1000000) / 1000000,
			})
			setValue('latitude', lat)
			setValue('longitude', lng)
		},
		[setValue],
	)

	const onMapClick = useCallback(
		(event: any) => {
			const { lng, lat } = event.lngLat
			setMarker({
				latitude: Math.round(lat * 1000000) / 1000000,
				longitude: Math.round(lng * 1000000) / 1000000,
			})
			setValue('latitude', lat)
			setValue('longitude', lng)
		},
		[setValue],
	)

	return (
		<div className="flex h-full w-full flex-col">
			<div className="grow">
				<BaseMap
					ref={mapRef}
					initialViewState={{
						latitude: marker.latitude ? Number(marker.latitude) : 51,
						longitude: marker.longitude ? Number(marker.longitude) : 7,
						zoom: 3.5,
					}}
					onClick={onMapClick}
				>
					{isValidLocation({
						latitude: Number(marker.latitude),
						longitude: Number(marker.longitude),
					}) && (
						<Marker
							latitude={Number(marker.latitude)}
							longitude={Number(marker.longitude)}
							anchor="center"
							draggable
							onDrag={onMarkerDrag}
						/>
					)}
					<NavigationControl position="top-right" showCompass={false} />
					<GeolocateControl
						position="bottom-right"
						positionOptions={{
							enableHighAccuracy: true,
							timeout: 10_000,
						}}
						fitBoundsOptions={{
							maxZoom: 14,
						}}
					/>
				</BaseMap>
			</div>

			<div className="bg-background grid w-full gap-4 p-4 lg:grid-cols-2">
				<div>
					<Label htmlFor="latitude">{t('latitude')}</Label>
					<Input
						id="latitude"
						type="number"
						step="any"
						min={LOCATION_LIMITS.latitude.min}
						max={LOCATION_LIMITS.latitude.max}
						{...register('latitude')}
						value={marker.latitude === '' ? '' : String(marker.latitude)}
						onChange={handleLatitudeChange}
						placeholder={t('enter latitude')}
						className="w-full rounded-md border p-2"
					/>
					{errors.latitude?.message ? (
						<p className="mt-1 text-sm text-red-600">
							{String(errors.latitude.message)}
						</p>
					) : null}
				</div>

				<div>
					<Label htmlFor="longitude">{t('longitude')}</Label>
					<Input
						id="longitude"
						type="number"
						step="any"
						min={LOCATION_LIMITS.longitude.min}
						max={LOCATION_LIMITS.longitude.max}
						{...register('longitude')}
						value={marker.longitude === '' ? '' : String(marker.longitude)}
						onChange={handleLongitudeChange}
						placeholder={t('enter longitude')}
						className="w-full rounded-md border p-2"
					/>
					{errors.longitude?.message ? (
						<p className="mt-1 text-sm text-red-600">
							{String(errors.longitude.message)}
						</p>
					) : null}
				</div>

				<div className="space-y-3 lg:col-span-2">
					<fieldset>
						<legend className="text-sm font-medium">
							{t('public_location')}
						</legend>

						<div className="mt-2 grid gap-3 md:grid-cols-2">
							<label className="flex cursor-pointer gap-3 rounded-md border p-3">
								<input
									type="radio"
									value="masked"
									checked={locationPrivacy !== 'exact'}
									onChange={onLocationPrivacyChange}
									className="mt-1"
								/>
								<span>
									<span className="block text-sm font-medium">
										{t('show_approximate_location')}
									</span>
									<span className="text-muted-foreground mt-1 block text-sm">
										{t('show_approximate_location_description')}
									</span>
								</span>
							</label>

							<label className="flex cursor-pointer gap-3 rounded-md border p-3">
								<input
									type="radio"
									value="exact"
									checked={locationPrivacy === 'exact'}
									onChange={onLocationPrivacyChange}
									className="mt-1"
								/>
								<span>
									<span className="block text-sm font-medium">
										{t('show_exact_location')}
									</span>
									<span className="text-muted-foreground mt-1 block text-sm">
										{t('show_exact_location_description')}
									</span>
								</span>
							</label>
						</div>
					</fieldset>

					<div className="max-w-xs">
						<Label htmlFor="locationPrivacyPreset">
							{t('approximation_area')}
						</Label>
						<select
							id="locationPrivacyPreset"
							value={`${locationPrivacyMinDistanceMeters}:${locationPrivacyRadiusMeters}`}
							onChange={onLocationPrivacyPresetChange}
							disabled={locationPrivacy === 'exact'}
							className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
						>
							{LOCATION_PRIVACY_DISTANCE_PRESETS.map((preset) => (
								<option
									key={`${preset.min}:${preset.max}`}
									value={`${preset.min}:${preset.max}`}
								>
									{t('distance_range', {
										min: formatDistance(preset.min),
										max: formatDistance(preset.max),
									})}
								</option>
							))}
						</select>
						<input type="hidden" {...register('locationPrivacy')} />
						<input
							type="hidden"
							{...register('locationPrivacyMinDistanceMeters')}
						/>
						<input type="hidden" {...register('locationPrivacyRadiusMeters')} />
						{errors.locationPrivacyMinDistanceMeters?.message ? (
							<p className="mt-1 text-sm text-red-600">
								{String(errors.locationPrivacyMinDistanceMeters.message)}
							</p>
						) : null}
					</div>
				</div>
			</div>
		</div>
	)
}
