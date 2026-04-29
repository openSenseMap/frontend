import { type Feature, type Point } from 'geojson'
import maplibregl from 'maplibre-gl'

const colors = [
	{ color: '#4EAF47', opacity: 1 },
	{ color: '#575757', opacity: 0.65 },
	{ color: '#575757', opacity: 0.65 },
	{ color: '#38AADD', opacity: 1 },
]

/**
 * Not a regular TSX component, but a function that creates a maplibre marker for a given cluster feature. The marker is a donut chart showing the distribution of device statuses within the cluster.
 */
export const ClusterMarker = (props: {
	clusterFeature: Feature<Point, any>
}) => {
	const { clusterFeature } = props
	const coords = clusterFeature.geometry.coordinates
	const longitude = coords[0]
	const latitude = coords[1]
	const pointCount = clusterFeature.properties?.point_count ?? 0
	const active = clusterFeature.properties?.active ?? 0
	const inactive = clusterFeature.properties?.inactive ?? 0
	const old = clusterFeature.properties?.old ?? 0
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

	const arcOffsets: number[] = []
	for (const c of [active, inactive, old]) {
		if (arcOffsets.length === 0) arcOffsets.push(c)
		// cumulative sum
		else arcOffsets.push(arcOffsets[arcOffsets.length - 1] + c)
	}

	const e = document.createElement('div')
	e.innerHTML = `<svg
				width="${w}"
				height="${w}"
				viewBox="0 0 ${w} ${w}"
				text-anchor="middle"
				style="font: bold ${fontSize}px sans-serif; display: block;"
			>
				${[active, inactive, old]
					.map((count, i) => {
						const start = arcOffsets[i] / pointCount
						let end = (arcOffsets[i] + count) / pointCount

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
								fill="${colors[i].color}"
								fill-opacity="${colors[i].opacity}"
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

	return new maplibregl.Marker({ element: e }).setLngLat([longitude, latitude])
}
