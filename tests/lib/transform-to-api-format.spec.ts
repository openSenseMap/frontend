import { transformDeviceToApiFormat } from '~/lib/device-transform'

describe('transformDeviceToApiFormat', () => {
	const distanceMeters = (
		first: { latitude: number; longitude: number },
		second: { latitude: number; longitude: number },
	) => {
		const earthRadiusMeters = 6371008.8
		const toRadians = (value: number) => (value * Math.PI) / 180
		const firstLatitude = toRadians(first.latitude)
		const secondLatitude = toRadians(second.latitude)
		const deltaLatitude = toRadians(second.latitude - first.latitude)
		const deltaLongitude = toRadians(second.longitude - first.longitude)
		const a =
			Math.sin(deltaLatitude / 2) ** 2 +
			Math.cos(firstLatitude) *
				Math.cos(secondLatitude) *
				Math.sin(deltaLongitude / 2) ** 2

		return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	}

	const mockDevice = {
		id: 'test-device-id',
		name: 'Test Device',
		description: 'A test device',
		image: 'https://example.com/image.jpg',
		link: 'https://example.com',
		tags: ['bike', 'outdoor'],
		exposure: 'mobile',
		model: 'custom',
		latitude: 37.7749,
		longitude: -122.4194,
		useAuth: true,
		public: false,
		status: 'active',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T12:00:00Z'),
		expiresAt: new Date('2024-12-31T23:59:59Z'),
		userId: 'user-123',
		sensors: [
			{
				id: 'sensor-1',
				title: 'Temperature',
				unit: '°C',
				sensorType: 'HDC1080',
				lastMeasurement: {
					createdAt: '2024-01-01T12:00:00Z',
					value: '25.5',
				},
			},
			{
				id: 'sensor-2',
				title: 'Humidity',
				unit: '%',
				sensorType: 'HDC1080',
				lastMeasurement: null,
			},
		],
	}

	test('transforms device with all fields', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result).toEqual(
			expect.objectContaining({
				_id: 'test-device-id',
				grouptag: ['bike', 'outdoor'],
				name: 'Test Device',
				description: 'A test device',
				image: 'https://example.com/image.jpg',
				link: 'https://example.com',
				exposure: 'mobile',
				model: 'custom',
				latitude: 37.7749,
				longitude: -122.4194,
				locationDisclosure: {
					mode: 'exact',
					accuracyMeters: 0,
					minDistanceMeters: 0,
					maxDistanceMeters: 0,
					method: null,
				},
				useAuth: true,
				public: false,
				status: 'active',
				createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
				updatedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
				expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
				userId: 'user-123',
				currentLocation: {
					type: 'Point',
					coordinates: [-122.4194, 37.7749],
					timestamp: '2024-01-01T12:00:00.000Z',
				},
				lastMeasurementAt: '2024-01-01T12:00:00.000Z',
				loc: [
					{
						geometry: {
							type: 'Point',
							coordinates: [-122.4194, 37.7749],
							timestamp: '2024-01-01T12:00:00.000Z',
						},
						type: 'Feature',
					},
				],
				integrations: {
					mqtt: {
						enabled: false,
					},
				},
				access_token: undefined,
				sensors: [
					expect.objectContaining({
						_id: 'sensor-1',
						title: 'Temperature',
						unit: '°C',
						sensorType: 'HDC1080',
						lastMeasurement: {
							createdAt: '2024-01-01T12:00:00Z',
							value: '25.5',
						},
					}),
					expect.objectContaining({
						_id: 'sensor-2',
						title: 'Humidity',
						unit: '%',
						sensorType: 'HDC1080',
						lastMeasurement: null,
					}),
				],
			}),
		)
	})

	test('handles null tags by defaulting to empty array', () => {
		const deviceWithNullTags = { ...mockDevice, tags: null }
		const result = transformDeviceToApiFormat(deviceWithNullTags as any)

		expect(result.grouptag).toEqual([])
	})

	test('handles undefined tags by defaulting to empty array', () => {
		const deviceWithUndefinedTags = { ...mockDevice, tags: undefined }
		const result = transformDeviceToApiFormat(deviceWithUndefinedTags as any)

		expect(result.grouptag).toEqual([])
	})

	test('handles missing sensors by defaulting to empty array', () => {
		const deviceWithoutSensors = { ...mockDevice, sensors: undefined }
		const result = transformDeviceToApiFormat(deviceWithoutSensors as any)

		expect(result.sensors).toEqual([])
	})

	test('handles null sensors by defaulting to empty array', () => {
		const deviceWithNullSensors = { ...mockDevice, sensors: null }
		const result = transformDeviceToApiFormat(deviceWithNullSensors as any)

		expect(result.sensors).toEqual([])
	})

	test('transforms sensors correctly', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result.sensors).toHaveLength(2)
		expect(result.sensors[0]).toEqual(
			expect.objectContaining({
				_id: 'sensor-1',
				title: 'Temperature',
				unit: '°C',
				sensorType: 'HDC1080',
				lastMeasurement: {
					createdAt: '2024-01-01T12:00:00Z',
					value: '25.5',
				},
			}),
		)
		expect(result.sensors[1]).toEqual(
			expect.objectContaining({
				_id: 'sensor-2',
				title: 'Humidity',
				unit: '%',
				sensorType: 'HDC1080',
				lastMeasurement: null,
			}),
		)
	})

	test('generates correct currentLocation structure', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result.currentLocation).toEqual({
			type: 'Point',
			coordinates: [-122.4194, 37.7749], // [longitude, latitude]
			timestamp: '2024-01-01T12:00:00.000Z',
		})
	})

	test('generates correct loc array structure', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result.loc).toEqual([
			{
				geometry: {
					type: 'Point',
					coordinates: [-122.4194, 37.7749], // [longitude, latitude]
					timestamp: '2024-01-01T12:00:00.000Z',
				},
				type: 'Feature',
			},
		])
	})

	test('returns exact coordinates when includeExactLocation is true', () => {
		const maskedDevice = {
			...mockDevice,
			locationPrivacy: 'masked',
			locationPrivacyMinDistanceMeters: 20,
			locationPrivacyRadiusMeters: 50,
			locationPrivacyMethod: 'stable-donut-displacement-v1',
		}

		const result = transformDeviceToApiFormat(maskedDevice as any, {
			includeExactLocation: true,
		})

		expect(result.latitude).toBe(mockDevice.latitude)
		expect(result.longitude).toBe(mockDevice.longitude)
		expect(result.currentLocation.coordinates).toEqual([
			mockDevice.longitude,
			mockDevice.latitude,
		])
		expect(result.loc[0].geometry.coordinates).toEqual([
			mockDevice.longitude,
			mockDevice.latitude,
		])
		expect(result.locationDisclosure).toEqual({
			mode: 'exact',
			accuracyMeters: 0,
			minDistanceMeters: 0,
			maxDistanceMeters: 0,
			method: null,
		})
	})

	test('returns stable donut-masked coordinates by default for masked devices', () => {
		const maskedDevice = {
			...mockDevice,
			locationPrivacy: 'masked',
			locationPrivacyMinDistanceMeters: 20,
			locationPrivacyRadiusMeters: 50,
			locationPrivacyMethod: 'stable-donut-displacement-v1',
		}

		const result = transformDeviceToApiFormat(maskedDevice as any)
		const repeatedResult = transformDeviceToApiFormat(maskedDevice as any)
		const displacementMeters = distanceMeters(
			{
				latitude: mockDevice.latitude,
				longitude: mockDevice.longitude,
			},
			{
				latitude: result.latitude,
				longitude: result.longitude,
			},
		)

		expect(result.latitude).not.toBe(mockDevice.latitude)
		expect(result.longitude).not.toBe(mockDevice.longitude)
		expect(result.currentLocation.coordinates).toEqual([
			result.longitude,
			result.latitude,
		])
		expect(result.loc[0].geometry.coordinates).toEqual([
			result.longitude,
			result.latitude,
		])
		expect(repeatedResult.currentLocation.coordinates).toEqual(
			result.currentLocation.coordinates,
		)
		expect(displacementMeters).toBeGreaterThanOrEqual(20)
		expect(displacementMeters).toBeLessThanOrEqual(50)
		expect(result.locationDisclosure).toEqual({
			mode: 'masked',
			accuracyMeters: 50,
			minDistanceMeters: 20,
			maxDistanceMeters: 50,
			method: 'stable-donut-displacement-v1',
		})
	})

	test('sets correct integrations structure', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result.integrations).toEqual({
			mqtt: {
				enabled: false,
			},
		})
	})

	test('handles minimal device data', () => {
		const minimalDevice = {
			id: 'minimal-id',
			name: 'Minimal Device',
			latitude: 0,
			longitude: 0,
			updatedAt: new Date('2024-01-01T00:00:00Z'),
		}

		const result = transformDeviceToApiFormat(minimalDevice as any)

		expect(result._id).toBe('minimal-id')
		expect(result.name).toBe('Minimal Device')
		expect(result.grouptag).toEqual([])
		expect(result.sensors).toEqual([])
		expect(result.currentLocation.coordinates).toEqual([0, 0])
		expect(result.loc[0].geometry.coordinates).toEqual([0, 0])
	})

	test('preserves all original device fields', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		// Check that all original fields are preserved
		expect(result.name).toBe(mockDevice.name)
		expect(result.description).toBe(mockDevice.description)
		expect(result.image).toBe(mockDevice.image)
		expect(result.link).toBe(mockDevice.link)
		expect(result.exposure).toBe(mockDevice.exposure)
		expect(result.model).toBe(mockDevice.model)
		expect(result.latitude).toBe(mockDevice.latitude)
		expect(result.longitude).toBe(mockDevice.longitude)
		expect(result.useAuth).toBe(mockDevice.useAuth)
		expect(result.public).toBe(mockDevice.public)
		expect(result.status).toBe(mockDevice.status)
		expect(result.createdAt).toBe(mockDevice.createdAt.toISOString())
		expect(result.updatedAt).toBe(mockDevice.updatedAt.toISOString())
		expect(result.expiresAt).toBe(mockDevice.expiresAt.toISOString())
		expect(result.userId).toBe(mockDevice.userId)
	})

	test('converts numeric lastMeasurement values to strings', () => {
		const deviceWithNumericMeasurement = {
			...mockDevice,
			sensors: [
				{
					id: 'sensor-1',
					title: 'Temperature',
					unit: '°C',
					sensorType: 'HDC1080',
					lastMeasurement: {
						createdAt: '2024-01-01T12:00:00Z',
						value: 25.5,
					},
				},
			],
		}

		const result = transformDeviceToApiFormat(
			deviceWithNumericMeasurement as any,
		)

		expect(result.sensors[0].lastMeasurement).toEqual({
			createdAt: '2024-01-01T12:00:00Z',
			value: '25.5',
		})
		expect(typeof result.sensors[0].lastMeasurement?.value).toBe('string')
	})

	test('preserves string lastMeasurement values', () => {
		const result = transformDeviceToApiFormat(mockDevice as any)

		expect(result.sensors[0].lastMeasurement?.value).toBe('25.5')
		expect(typeof result.sensors[0].lastMeasurement?.value).toBe('string')
	})
})
