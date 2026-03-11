'use client'

import { useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'

interface Device {
	id: string
	name: string
	latitude: number
	longitude: number
}

interface GlobeComponentProps {
	latestDevices: Device[]
}

export const GlobeComponent = ({ latestDevices }: GlobeComponentProps) => {
	const globeEl = useRef<any>(null)

	const colorInterpolator = (t: number) =>
		`rgba(${50 + Math.floor(t * 50)}, ${100 + Math.floor(t * 100)}, 255, ${Math.sqrt(1 - t)})`

	// Transform latestDevices into the format required by Globe's ringsData
	const sensorData = latestDevices.map((device) => ({
		lat: device.latitude,
		lng: device.longitude,
		maxR: 10,
		propagationSpeed: 5,
		repeatPeriod: 1000,
	}))

	useEffect(() => {
		if (globeEl.current) {
			globeEl.current.controls().autoRotate = true
			globeEl.current.controls().autoRotateSpeed = 1.0
			globeEl.current.controls().enableZoom = false
		}
	}, [])

	return (
		<Globe
			ref={globeEl}
			globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
			bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
			backgroundColor="rgba(0, 0, 0, 0)"
			width={500}
			height={500}
			ringsData={sensorData}
			ringColor={() => colorInterpolator}
			ringMaxRadius="maxR"
			ringPropagationSpeed="propagationSpeed"
			ringRepeatPeriod="repeatPeriod"
		/>
	)
}
