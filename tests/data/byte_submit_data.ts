export function byteSubmitData(
	sensors: { id: string }[],
	withTimestamps = false,
): Uint8Array {
	const bytesPerSensor = withTimestamps ? 20 : 16
	const buffer = new ArrayBuffer(sensors.length * bytesPerSensor)
	const view = new DataView(buffer)
	const bytes = new Uint8Array(buffer)

	sensors.forEach((sensor, i) => {
		const offset = i * bytesPerSensor

		const idHex = sensor.id.toLowerCase()

		if (!/^[0-9a-f]{24}$/i.test(idHex)) {
			throw new Error(
				`Invalid sensor ID format: ${sensor.id}. Expected 24 hex characters.`,
			)
		}

		for (let j = 0; j < 12; j++) {
			const hexByte = idHex.slice(j * 2, j * 2 + 2)
			bytes[offset + j] = parseInt(hexByte, 16)
		}

		view.setFloat32(offset + 12, 20.0 + i, true)

		if (withTimestamps) {
			const timestampSeconds = Math.floor((Date.now() - i * 60_000) / 1000)
			view.setUint32(offset + 16, timestampSeconds, true)
		}
	})

	return bytes
}
