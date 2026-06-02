import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
	Marker,
	NavigationControl,
	GeolocateControl,
	type MapRef,
	type MarkerDragEvent,
} from 'react-map-gl/maplibre'
import { Input } from '@/components/ui/input'
import { Label } from '~/components/ui/label'
import { BaseMap } from '~/components/base-map'
import { LOCATION_LIMITS, isValidLocation } from '~/lib/location'

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

	const [marker, setMarker] = useState<{
		latitude: number | string
		longitude: number | string
	}>({
		latitude: savedLatitude || '',
		longitude: savedLongitude || '',
	})

	useEffect(() => {
		if (savedLatitude !== undefined && savedLongitude !== undefined) {
			setMarker({
				latitude: savedLatitude,
				longitude: savedLongitude,
			})
		}
	}, [savedLatitude, savedLongitude])

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
						position="top-right"
						showAccuracyCircle={true}
						trackUserLocation={true}
					/>
				</BaseMap>
			</div>

			<div className="flex w-full items-center justify-around bg-gray-50 p-4 dark:bg-gray-800">
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
			</div>
		</div>
	)
}
