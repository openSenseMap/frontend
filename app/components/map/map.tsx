import { type Map as MapLibreMap } from 'maplibre-gl'
import { forwardRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
	type LayerSpecification,
	Map as ReactMap,
	NavigationControl,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'
import SpaceBackground from './space-background'

const DEFAULT_LIGHT_STYLE =
	'https://api.maptiler.com/maps/streets-v2/style.json?key=x4PkWnbJomR3gQAHHEce'

const DEFAULT_DARK_STYLE =
	'https://api.maptiler.com/maps/outdoor-v2/style.json?key=x4PkWnbJomR3gQAHHEce'

function applyGlobeAppearance(map: MapLibreMap) {
	map.setProjection({ type: 'globe' })

	// Atmosphere / halo around the globe.
	// MapLibre recommends interpolating atmosphere-blend for globe projection.
	map.setSky({
		'sky-color': '#0b1220',
		'horizon-color': '#7aa2ff',
		'fog-color': '#dfefff',
		'sky-horizon-blend': 0.12,
		'horizon-fog-blend': 0.08,
		'fog-ground-blend': 0.06,
		'atmosphere-blend': [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			1,
			3,
			1,
			5,
			0.85,
			7,
			0.45,
			9,
			0.12,
		],
	})

	// Optional terrain adds depth and helps the globe feel less flat.
	// Safe to skip if you don't want DEM tiles.
	if (!map.getSource('terrainSource')) {
		map.addSource('terrainSource', {
			type: 'raster-dem',
			url: 'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=x4PkWnbJomR3gQAHHEce',
			tileSize: 256,
		})
	}

	map.setTerrain({
		source: 'terrainSource',
		exaggeration: 1,
	})
}

const Map = forwardRef<MapRef, MapProps>(
	({ children, mapStyle, initialViewState, onLoad, ...props }, ref) => {
		const theme = 'dark'
		const { i18n } = useTranslation()

		const updateMapLanguage = useCallback(
			(map: MapLibreMap, locale: string) => {
				const style = map.getStyle()
				if (!style?.layers) return

				const shortLocale = locale.split('-')[0]

				style.layers.forEach((layer: LayerSpecification) => {
					if (!('layout' in layer) || !layer.layout) return

					const layout = layer.layout as Record<string, unknown>
					const textField = layout['text-field']
					if (!textField) return

					if (
						layer.id.includes('shield') ||
						layer.id.includes('road-number') ||
						layer.id.includes('exit') ||
						layer.id.includes('ref')
					) {
						return
					}

					try {
						map.setLayoutProperty(layer.id, 'text-field', [
							'coalesce',
							['get', `name_${shortLocale}`],
							['get', 'name_en'],
							['get', 'name'],
						])
					} catch {
						// Some layers don't support replacing text-field cleanly.
					}
				})
			},
			[],
		)

		const handleMapLoad = useCallback(
			(event: { target: MapLibreMap }) => {
				const map = event.target

				applyGlobeAppearance(map)
				updateMapLanguage(map, i18n.language)

				onLoad?.(event as any)
			},
			[i18n.language, onLoad, updateMapLanguage],
		)

		useEffect(() => {
			if (!ref || typeof ref === 'function' || !ref.current) return

			const map = ref.current.getMap()
			if (!map.isStyleLoaded()) return

			applyGlobeAppearance(map)
			updateMapLanguage(map, i18n.language)
		}, [i18n.language, ref, updateMapLanguage])

		return (
			<div className="map-space-shell">
				<SpaceBackground />
				<ReactMap
					id="osem"
					ref={ref}
					initialViewState={
						initialViewState ?? {
							longitude: 7.628202,
							latitude: 51.961563,
							zoom: 2,
						}
					}
					mapStyle={
						mapStyle ||
						(theme === 'dark' ? DEFAULT_DARK_STYLE : DEFAULT_LIGHT_STYLE)
					}
					projection={{ type: 'globe' }}
					dragRotate={false}
					pitchWithRotate={false}
					touchZoomRotate={{ around: 'center' }}
					hash={false}
					style={{
						width: '100%',
						height: '100%',
						position: 'fixed',
						top: 0,
						left: 0,
						background: 'transparent',
					}}
					onLoad={handleMapLoad}
					{...props}
				>
					{children}
					<NavigationControl position="bottom-right" showCompass={false} />
				</ReactMap>
			</div>
		)
	},
)

Map.displayName = 'Map'

export default Map
