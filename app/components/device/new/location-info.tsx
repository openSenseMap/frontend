import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import Spinner from '~/components/spinner'
import { useTerrainElevation } from '~/hooks/use-terrain-elevation'
import { calculateHeightAboveSeaLevel } from '~/lib/elevation'
import {
	LOCATION_LIMITS,
	deviceLocationInputSchema,
	isValidLocation,
} from '~/lib/location'

type DeviceLocationFormState = {
	latitude?: number | string
	longitude?: number | string
	heightAboveGround?: number | string
}

export function LocationStep() {
	const mapRef = useRef<MapRef | null>(null)
	const {
		register,
		setValue,
		watch,
		formState: { errors },
	} = useFormContext<DeviceLocationFormState>()
	const { t } = useTranslation('newdevice')
	const savedLatitude = watch('latitude')
	const savedLongitude = watch('longitude')
	const savedHeightAboveGround = watch('heightAboveGround')

	const [marker, setMarker] = useState<{
		latitude: number | string
		longitude: number | string
	}>({
		latitude: savedLatitude || '',
		longitude: savedLongitude || '',
	})

	useEffect(() => {
		if (savedLatitude !== undefined && savedLongitude !== undefined) {
			setMarker({ latitude: savedLatitude, longitude: savedLongitude })
		}
	}, [savedLatitude, savedLongitude])

	const markerLocation = useMemo(() => {
		if (marker.latitude === '' || marker.longitude === '') return null

		const candidate = {
			latitude: Number(marker.latitude),
			longitude: Number(marker.longitude),
		}

		return isValidLocation(candidate) ? candidate : null
	}, [marker.latitude, marker.longitude])

	const elevation = useTerrainElevation({
		latitude: markerLocation?.latitude,
		longitude: markerLocation?.longitude,
	})
	const parsedHeightAboveGround =
		deviceLocationInputSchema.shape.heightAboveGround.safeParse(
			savedHeightAboveGround,
		)

	const finalHeight =
		elevation.result && parsedHeightAboveGround.success
			? calculateHeightAboveSeaLevel(
					elevation.result.elevation,
					parsedHeightAboveGround.data,
				)
			: null

	const handleLatitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value.trim()
		const parsedValue = Number(value)
		const latitude =
			value === '' || !Number.isFinite(parsedValue) ? '' : parsedValue

		setMarker((current) => ({ ...current, latitude }))
		setValue('latitude', latitude === '' ? undefined : latitude, {
			shouldDirty: true,
			shouldValidate: true,
		})
	}

	const handleLongitudeChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const value = event.target.value.trim()
		const parsedValue = Number(value)
		const longitude =
			value === '' || !Number.isFinite(parsedValue) ? '' : parsedValue

		setMarker((current) => ({ ...current, longitude }))
		setValue('longitude', longitude === '' ? undefined : longitude, {
			shouldDirty: true,
			shouldValidate: true,
		})
	}

	const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value.trim()
		const parsedValue = Number(value)

		setValue(
			'heightAboveGround',
			value === '' || !Number.isFinite(parsedValue) ? undefined : parsedValue,
			{ shouldDirty: true, shouldValidate: true },
		)
	}

	const updateMarker = useCallback(
		(longitude: number, latitude: number) => {
			const roundedLatitude = Math.round(latitude * 1_000_000) / 1_000_000
			const roundedLongitude = Math.round(longitude * 1_000_000) / 1_000_000

			setMarker({
				latitude: roundedLatitude,
				longitude: roundedLongitude,
			})
			setValue('latitude', roundedLatitude, {
				shouldDirty: true,
				shouldValidate: true,
			})
			setValue('longitude', roundedLongitude, {
				shouldDirty: true,
				shouldValidate: true,
			})
		},
		[setValue],
	)

	const onMarkerDragEnd = useCallback(
		(event: MarkerDragEvent) => {
			updateMarker(event.lngLat.lng, event.lngLat.lat)
		},
		[updateMarker],
	)

	const onMapClick = useCallback(
		(event: { lngLat: { lng: number; lat: number } }) => {
			updateMarker(event.lngLat.lng, event.lngLat.lat)
		},
		[updateMarker],
	)

	const displayHeightValue = savedHeightAboveGround?.toString() ?? ''

	return (
		<div className="flex h-full w-full flex-col">
			<div className="grow">
				<BaseMap
					ref={mapRef}
					initialViewState={{
						latitude: markerLocation?.latitude ?? 51,
						longitude: markerLocation?.longitude ?? 7,
						zoom: 3.5,
					}}
					onClick={onMapClick}
				>
					{markerLocation ? (
						<Marker
							latitude={markerLocation.latitude}
							longitude={markerLocation.longitude}
							anchor="center"
							draggable
							onDragEnd={onMarkerDragEnd}
						/>
					) : null}
					<NavigationControl position="top-right" showCompass={false} />
					<GeolocateControl
						position="bottom-right"
						positionOptions={{
							enableHighAccuracy: true,
							timeout: 10_000,
						}}
						fitBoundsOptions={{ maxZoom: 14 }}
					/>
				</BaseMap>
			</div>

			<div className="bg-background grid w-full gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
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
							{t(String(errors.latitude.message))}
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
							{t(String(errors.longitude.message))}
						</p>
					) : null}
				</div>

				<div>
					<Label htmlFor="heightAboveGround">
						{t('height_above_ground')} ({t('optional')})
					</Label>
					<Input
						id="heightAboveGround"
						type="number"
						step="any"
						{...register('heightAboveGround')}
						value={displayHeightValue}
						onChange={handleHeightChange}
						placeholder={t('enter height above ground')}
						aria-describedby="height-info height-error"
						className="w-full rounded-md border p-2"
					/>
					<p id="height-info" className="text-muted-foreground mt-1 text-xs">
						{t('height_info_text')}
					</p>

					{elevation.status === 'loading' ? (
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
							<p>
								{elevation.error === 'unavailable'
									? t('elevation_unavailable')
									: t('elevation_error')}
							</p>
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
								{elevation.result.attribution ?? elevation.result.dataset}
								{elevation.result.datum ? ` (${elevation.result.datum})` : ''}
							</div>
						</div>
					) : null}

					{errors.heightAboveGround?.message ? (
						<p id="height-error" className="mt-1 text-sm text-red-600">
							{t(String(errors.heightAboveGround.message))}
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}
