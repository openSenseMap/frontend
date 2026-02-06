import {
	type GeoJsonProperties,
	type BBox,
	type FeatureCollection,
	type Point,
} from 'geojson'
import debounce from 'lodash.debounce'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { Marker, useMap } from 'react-map-gl'
import { type PointFeature } from 'supercluster'
import useSupercluster from 'use-supercluster'
import BoxMarker from './box-marker'
import DonutChartCluster from './donut-chart-cluster'
import { type DeviceClusterProperties } from '~/routes/explore'
import { type Device } from '~/schema'

const DEBOUNCE_VALUE = 50

// supercluster options
const options = {
	radius: 50,
	maxZoom: 14,
	map: (props: any) => ({ categories: { [props.status]: 1 } }),
	reduce: (accumulated: any, props: any) => {
		const categories: any = {}
		// clone the categories object from the accumulator
		for (const key in accumulated.categories) {
			categories[key] = accumulated.categories[key]
		}
		// add props' category data to the clone
		for (const key in props.categories) {
			if (key in accumulated.categories) {
				categories[key] = accumulated.categories[key] + props.categories[key]
			} else {
				categories[key] = props.categories[key]
			}
		}
		// assign the clone to the accumulator
		accumulated.categories = categories
	},
}

export default function ClusterLayer({
	devices,
}: {
	devices: FeatureCollection<Point, any>
}) {
	const { osem: mapRef } = useMap()

	// the viewport bounds and zoom level
	const [bounds, setBounds] = useState(
		mapRef?.getMap().getBounds().toArray().flat() as BBox,
	)
	const [zoom, setZoom] = useState(mapRef?.getZoom() || 0)

	// get clusters
	const points: PointFeature<GeoJsonProperties & Device>[] = useMemo(() => {
		return devices.features.map((device) => ({
			type: 'Feature',
			properties: {
				cluster: false,
				...device.properties,
			},
			geometry: device.geometry,
		}))
	}, [devices.features])

	// get bounds and zoom level from the map
	// debounce the change handler to prevent too many updates
	const debouncedChangeHandler = debounce(() => {
		if (!mapRef) return
		setBounds(mapRef.getMap().getBounds().toArray().flat() as BBox)
		setZoom(mapRef.getZoom())
	}, DEBOUNCE_VALUE)

	// register the debounced change handler to map events
	useEffect(() => {
		if (!mapRef) return

		mapRef?.getMap().on('load', debouncedChangeHandler)
		mapRef?.getMap().on('zoom', debouncedChangeHandler)
		mapRef?.getMap().on('move', debouncedChangeHandler)
		mapRef?.getMap().on('resize', debouncedChangeHandler)
	}, [debouncedChangeHandler, mapRef])

	const { clusters, supercluster } = useSupercluster({
		points,
		bounds,
		zoom,
		options,
	})

	const clusterOnClick = useCallback(
		(cluster: DeviceClusterProperties) => {
			// supercluster from hook can be null or undefined
			if (!supercluster) return

			const [longitude, latitude] = cluster.geometry.coordinates

			const expansionZoom = Math.min(
				supercluster.getClusterExpansionZoom(cluster.id as number),
				20,
			)

			mapRef?.getMap().flyTo({
				center: [longitude, latitude],
				animate: true,
				speed: 1.6,
				zoom: expansionZoom,
				essential: true,
			})
		},
		[mapRef, supercluster],
	)

	const clusterMarker = useMemo(() => {
		return clusters.map((cluster) => {
			// every cluster point has coordinates
			const [longitude, latitude] = cluster.geometry.coordinates
			// the point may be either a cluster or a crime point
			const { cluster: isCluster } = cluster.properties

			// we have a cluster to render
			if (isCluster) {
				return (
					<Marker
						key={`cluster-${cluster.id}`}
						latitude={latitude}
						longitude={longitude}
					>
						<DonutChartCluster
							cluster={cluster}
							clusterOnClick={clusterOnClick}
						/>
					</Marker>
				)
			}

			// we have a single device to render
			return (
				<BoxMarker
					key={`device-${(cluster.properties as Device).id}`}
					latitude={latitude}
					longitude={longitude}
					device={cluster.properties as Device}
				/>
			)
		})
	}, [clusterOnClick, clusters])

	return <>{clusterMarker}</>
}
