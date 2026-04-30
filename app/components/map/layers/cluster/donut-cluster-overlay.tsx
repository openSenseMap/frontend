import { useEffect, useMemo, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/maplibre'
import DonutChartCluster from './donut-chart-cluster'

type Props = {
	sourceId: string
}

export default function DonutClusterOverlay({ sourceId }: Props) {
	const { current: map } = useMap()
	const [clusters, setClusters] = useState<any[]>([])

	useEffect(() => {
		if (!map) return

		const update = () => {
			const features = map.querySourceFeatures(sourceId, {
				filter: ['has', 'point_count'],
			})

			setClusters(features)
		}

		update()

		map.on('move', update)
		map.on('zoom', update)
		map.on('data', update)

		return () => {
			map.off('move', update)
			map.off('zoom', update)
			map.off('data', update)
		}
	}, [map, sourceId])

	const markers = useMemo(() => {
		return clusters.map((cluster) => {
			const [longitude, latitude] = cluster.geometry.coordinates

			return (
				<Marker
					key={`cluster-${cluster.properties.cluster_id}`}
					longitude={longitude}
					latitude={latitude}
				>
					<DonutChartCluster cluster={cluster} />
				</Marker>
			)
		})
	}, [clusters])

	return <>{markers}</>
}
