import { useMap } from 'react-map-gl/maplibre'

type DonutChartClusterType = {
	cluster: any
	sourceId?: string
}

const colors = [
	{ color: '#4EAF47', opacity: 1 }, // active
	{ color: '#575757', opacity: 0.65 }, // inactive
]

export default function DonutChartCluster({
	cluster,
	sourceId = 'osem-devices',
}: DonutChartClusterType) {
	const { osem: mapRef } = useMap()

	const {
		active = 0,
		inactive = 0,
		point_count: pointCount = 0,
		cluster_id: clusterId,
	} = cluster.properties

	const counts = [active, inactive]
	const total = counts.reduce((sum, count) => sum + count, 0)

	const fontSize = pointCount >= 1000 ? 14 : pointCount >= 100 ? 12 : 10

	const r = pointCount >= 1000 ? 36 : pointCount >= 100 ? 20 : 18
	const r0 = Math.round(r * 0.7)
	const w = r * 2

	const handleClick = async () => {
		if (!mapRef || clusterId == null) return

		const map = mapRef.getMap()
		const source: any = map.getSource(sourceId)

		if (!source || !('getClusterExpansionZoom' in source)) return

		const expansionZoom = await source.getClusterExpansionZoom(clusterId)

		map.flyTo({
			center: cluster.geometry.coordinates,
			zoom: Math.min(expansionZoom, 20),
			animate: true,
			speed: 1.6,
			essential: true,
		})
	}

	return (
		<div onClick={handleClick} className="cursor-pointer">
			<svg
				width={w}
				height={w}
				viewBox={`0 0 ${w} ${w}`}
				textAnchor="middle"
				style={{
					font: `${fontSize}px sans-serif`,
					display: 'block',
					fontWeight: 'bold',
				}}
			>
				{counts.map((count, i) => {
					if (!count || total === 0) return null

					const offset = counts
						.slice(0, i)
						.reduce((sum, value) => sum + value, 0)

					const start = offset / total
					let end = (offset + count) / total

					if (end - start === 1) end -= 0.00001

					const a0 = 2 * Math.PI * (start - 0.25)
					const a1 = 2 * Math.PI * (end - 0.25)

					const x0 = Math.cos(a0)
					const y0 = Math.sin(a0)
					const x1 = Math.cos(a1)
					const y1 = Math.sin(a1)

					const largeArc = end - start > 0.5 ? 1 : 0

					return (
						<path
							key={i}
							d={`M ${r + r0 * x0} ${r + r0 * y0}
								L ${r + r * x0} ${r + r * y0}
								A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1}
								L ${r + r0 * x1} ${r + r0 * y1}
								A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0}`}
							fill={colors[i].color}
							fillOpacity={colors[i].opacity}
						/>
					)
				})}

				<circle cx={r} cy={r} r={r0} fill="transparent" />

				<text
					dominantBaseline="central"
					fill="black"
					transform={`translate(${r}, ${r})`}
				>
					{pointCount}
				</text>
			</svg>
		</div>
	)
}
