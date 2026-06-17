import { type Feature, type Point } from 'geojson'
import maplibregl from 'maplibre-gl'

const colors = [
	{ color: '#4EAF47', opacity: 1 },
	{ color: '#575757', opacity: 0.65 },
]

/**
 * Not a regular TSX component, but a function that creates a maplibre marker for a given cluster feature. The marker is a donut chart showing the distribution of device statuses within the cluster.
 */
export const ClusterMarker = (props: {
	clusterFeature: Feature<Point, any>
	map: maplibregl.Map
	sourceId?: string
}) => {
	const { clusterFeature, map, sourceId = 'osem-devices' } = props
	const coords = clusterFeature.geometry.coordinates
	const longitude = coords[0]
	const latitude = coords[1]
	const pointCount = Number(clusterFeature.properties?.point_count ?? 0)
	const active = Number(clusterFeature.properties?.active ?? 0)
	const inactive = Math.max(pointCount - active, 0)
	const fontSize =
		pointCount >= 1000
			? 14
			: pointCount >= 100
				? 12
				: pointCount >= 10
					? 10
					: 10
	const r =
		pointCount >= 1000
			? 36
			: pointCount >= 100
				? 20
				: pointCount >= 10
					? 18
					: 18
	const r0 = Math.round(r * 0.7)
	const w = r * 2

	const segments = [active, inactive].map((count, i) => ({
		count,
		color: colors[i],
		offset: 0,
	}))
	let total = 0

	for (const segment of segments) {
		segment.offset = total
		total += segment.count
	}

	const e = document.createElement('div')
	e.setAttribute(
		'aria-label',
		`${pointCount} devices, ${active} active, ${inactive} inactive`,
	)
	e.innerHTML = `<svg
				width="${w}"
				height="${w}"
				viewBox="0 0 ${w} ${w}"
				text-anchor="middle"
				style="font: bold ${fontSize}px sans-serif; display: block;"
			>
				${segments
					.filter((segment) => segment.count > 0)
					.map((segment) => {
						const start = segment.offset / total
						let end = (segment.offset + segment.count) / total

						if (end - start === 1) end -= 0.00001
						const a0 = 2 * Math.PI * (start - 0.25)
						const a1 = 2 * Math.PI * (end - 0.25)
						const x0 = Math.cos(a0),
							y0 = Math.sin(a0)
						const x1 = Math.cos(a1),
							y1 = Math.sin(a1)
						const largeArc = end - start > 0.5 ? 1 : 0

						return `
							<path
								d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
									r + +r * y0
								} A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${
									r + r0 * x1
								} ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
									r + r0 * y0
								}"
								fill="${segment.color.color}"
								fill-opacity="${segment.color.opacity}"
							/>
						`
					})
					.join('')}
				<circle cx="${r}" cy="${r}" r="${r0}" fill="transparent" />
				<text
					dominant-baseline="central"
					fill="black"
					transform="translate(${r}, ${r})"
				>
					${pointCount}
				</text>
			</svg>`


    e.style.cursor = 'pointer'
	e.addEventListener('click', async (event) => {
		event.stopPropagation()

		const clusterId = clusterFeature.properties?.cluster_id
		if (clusterId == null) return

		const source: any = map.getSource(sourceId)
		if (!source || !('getClusterExpansionZoom' in source)) return

		const expansionZoom = await source.getClusterExpansionZoom(clusterId)

		map.flyTo({
			center: [longitude, latitude],
			zoom: Math.min(expansionZoom + 2, 20),
			animate: true,
			speed: 1.6,
			essential: true,
		})
	})

	return new maplibregl.Marker({ element: e }).setLngLat([longitude, latitude])
}
