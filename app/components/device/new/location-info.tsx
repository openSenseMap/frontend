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
import { LOCATION_LIMITS, isValidLocation } from '~/lib/location'
import { getElevation } from '~/services/elevation.service'
import Spinner from '~/components/spinner'

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
	const savedHeight = watch('height')

	const [marker, setMarker] = useState<{
		latitude: number | string
		longitude: number | string
	}>({
		latitude: savedLatitude || '',
		longitude: savedLongitude || '',
	})

	// State for terrain elevation (from OpenTopoData API)
	const [terrainElevation, setTerrainElevation] = useState<number | null>(null)
	// Loading state for elevation fetch
	const [isFetchingElevation, setIsFetchingElevation] = useState(false)
	// Error state for elevation fetch
	const [elevationError, setElevationError] = useState<string | null>(null)

	useEffect(() => {
		if (savedLatitude !== undefined && savedLongitude !== undefined) {
			setMarker({
				latitude: savedLatitude,
				longitude: savedLongitude,
			})
		}
	}, [savedLatitude, savedLongitude])

	// Function to fetch terrain elevation from OpenTopoData API
	const fetchTerrainElevation = useCallback(
		async (lat: number, lng: number) => {
			setIsFetchingElevation(true)
			setElevationError(null)

			try {
				const elevation = await getElevation(lat, lng)
				if (elevation !== null) {
					setTerrainElevation(elevation)
				} else {
					setElevationError(t('elevation_unavailable'))
				}
			} catch {
				setElevationError(t('elevation_error'))
			}
			finally {
				setIsFetchingElevation(false)
			}
		},
		[t],
	)

	// Effect to fetch elevation when marker position changes
	useEffect(() => {
		const lat = typeof marker.latitude === 'number' ? marker.latitude : Number(marker.latitude)
		const lng = typeof marker.longitude === 'number' ? marker.longitude : Number(marker.longitude)

		if (isValidLocation({ latitude: lat, longitude: lng })) {
			void fetchTerrainElevation(lat, lng)
		} else {
			// Clear elevation if location is invalid
			setTerrainElevation(null)
			setElevationError(null)
		}
	}, [marker.latitude, marker.longitude, fetchTerrainElevation])

	// Calculate final height above sea level for display
	const finalHeightAboveSeaLevel = useCallback(() => {
		if (terrainElevation === null) return null
		if (savedHeight === undefined || savedHeight === null || savedHeight === '') {
			// If no height above ground is specified, final height is just terrain elevation
			return terrainElevation
		}
		// Add terrain elevation and height above ground
		return terrainElevation + Number(savedHeight)
	}, [terrainElevation, savedHeight])

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

	const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.trim()
		const parsedValue = parseFloat(value)

		// Store height above ground in the form
		setValue(
			'height',
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

	const displayHeightValue = savedHeight !== undefined && savedHeight !== null && savedHeight !== ''
		? String(savedHeight)
		: ''

	const finalHeight = finalHeightAboveSeaLevel()

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

				<div>
					<Label htmlFor="height">
						{t('height_above_ground')} ({t('optional')})
					</Label>
					<Input
						id="height"
						type="number"
						step="any"
						{...register('height')}
						value={displayHeightValue}
						onChange={handleHeightChange}
						placeholder={t('enter height above ground')}
						aria-describedby="height-info height-error"
						className="w-full rounded-md border p-2"
					/>
					<p id="height-info" className="text-muted-foreground mt-1 text-xs">
						{t('height_info_text')}
					</p>

					{/* Display terrain elevation and final height */}
					{isFetchingElevation ? (
						<div className="mt-2 flex items-center gap-2">
							<div className="h-4 w-4">
								<Spinner />
							</div>
							<span className="text-sm text-muted-foreground">
								{t('fetching_elevation')}
							</span>
						</div>
					) : elevationError ? (
						<p className="mt-2 text-sm text-amber-600">{elevationError}</p>
					) : terrainElevation !== null ? (
						<div className="mt-2 text-sm">
							<div className="text-muted-foreground">
								{t('terrain_elevation')}: {terrainElevation.toFixed(1)} m
							</div>
							{finalHeight !== null && (
								<div className="text-muted-foreground">
									{t('final_height')}: {finalHeight.toFixed(1)} m
								</div>
							)}
						</div>
					) : null}

					{errors.height?.message ? (
						<p id="height-error" className="mt-1 text-sm text-red-600">
							{String(errors.height.message)}
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}
