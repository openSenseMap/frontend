import { forwardRef } from 'react'
import {
	NavigationControl,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import SpaceBackground from './space-background'
import { BaseMap } from '@/components/base-map'

const Map = forwardRef<MapRef, MapProps>(
	({ children, initialViewState, ...props }, ref) => {
		return (
			<div className="map-space-shell">
				<SpaceBackground />
				<BaseMap
					id="osem"
					ref={ref}
					initialViewState={
						initialViewState ?? {
							longitude: 7.628202,
							latitude: 51.961563,
							zoom: 2,
						}
					}
					hash={true}
					style={{
						width: '100%',
						height: '100%',
						position: 'fixed',
						top: 0,
						left: 0,
						background: 'transparent',
					}}
					{...props}
				>
					{children}
					<NavigationControl position="bottom-right" showCompass={false} />
				</BaseMap>
			</div>
		)
	},
)

Map.displayName = 'Map'

export default Map
