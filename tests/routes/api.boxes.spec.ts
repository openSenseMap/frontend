import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router'
import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import { deleteUserByEmail } from '~/models/user.server'
import { loader, action } from '~/routes/api.boxes'
import { type Device, type User } from '~/schema'

const BOXES_TEST_USER = generateTestUserCredentials()
const generateMinimalDevice = (
	location: number[] | {} = [123, 12, 34],
	exposure = 'mobile',
	name = 'senseBox' + new Date().getTime(),
) => ({
	exposure,
	location,
	name,
	model: 'homeV2Ethernet',
})

describe('openSenseMap API Routes: /boxes', () => {
	let user: User | null = null
	let jwt: string = ''
	let createdDeviceIds: string[] = []
	let queryableDevice: Device | null = null
	const grouptag = 'testgroup' + Math.random()

	beforeAll(async () => {
		const testUser = await registerUser(
			BOXES_TEST_USER.name,
			BOXES_TEST_USER.email,
			BOXES_TEST_USER.password,
			'en_US',
		)
		user = testUser as User
		const { token } = await createToken(testUser as User)
		jwt = token

		queryableDevice = await createDevice(
			{
				...generateMinimalDevice(),
				latitude: 123,
				longitude: 12,
				tags: [grouptag],
				useAuth: false,
			},
			(testUser as User).id,
		)
		createdDeviceIds.push(queryableDevice.id)
	})

	afterAll(async () => {
		for (const deviceId of createdDeviceIds) {
			try {
				await deleteDevice({ id: deviceId })
			} catch (error) {
				console.error(`Failed to delete device ${deviceId}:`, error)
			}
		}
		if (user) {
			await deleteUserByEmail(BOXES_TEST_USER.email)
		}
	})

	describe('GET', () => {
		it('should search for boxes with a specific name and limit the results', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&name=${queryableDevice?.name}&limit=2`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			const response: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			expect(response).toBeDefined()
			expect(Array.isArray(response?.features)).toBe(true)
			expect(response?.features.length).lessThanOrEqual(2)
		})

		it('should deny searching for a name if limit is greater than max value', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&name=${queryableDevice?.name}&limit=21`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			await expect(async () => {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
			}).rejects.toThrow()
		})

		it('should deny searching for a name if limit is lower than min value', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&name=sensebox&limit=0`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			await expect(async () => {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
			}).rejects.toThrow()
		})

		it('should allow to request minimal boxes', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?minimal=true&format=geojson`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const response: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			// Assert
			expect(response).toBeDefined()
			expect(response.type).toBe('FeatureCollection')
			expect(Array.isArray(response?.features)).toBe(true)

			if (response.features.length > 0) {
				const feature = response.features[0]
				expect(feature.type).toBe('Feature')
				expect(feature.properties).toBeDefined()

				// Should have minimal fields
				const props = feature.properties
				expect(props?._id || props?.id).toBeDefined()
				expect(props?.name).toBeDefined()

				// Should NOT include these fields in minimal mode
				expect(props?.loc).toBeUndefined()
				expect(props?.locations).toBeUndefined()
				expect(props?.weblink).toBeUndefined()
				expect(props?.image).toBeUndefined()
				expect(props?.description).toBeUndefined()
				expect(props?.model).toBeUndefined()
				expect(props?.sensors).toBeUndefined()
			}
		})

		it('should return the correct count and correct schema of boxes for /boxes GET with date parameter', async () => {
			const tenDaysAgoIso = new Date(
				Date.now() - 10 * 24 * 60 * 60 * 1000,
			).toISOString()

			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&date=${tenDaysAgoIso}`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			const response: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			// Assert
			expect(response).toBeDefined()
			expect(response.type).toBe('FeatureCollection')
			expect(Array.isArray(response?.features)).toBe(true)

			// Verify that returned boxes have sensor measurements after the specified date
			if (response.features.length > 0) {
				response.features.forEach((feature: any) => {
					expect(feature.type).toBe('Feature')
					expect(feature.properties).toBeDefined()

					// If the box has sensors with measurements, they should be after the date
					if (
						feature.properties?.sensors &&
						Array.isArray(feature.properties.sensors)
					) {
						const hasRecentMeasurement = feature.properties.sensors.some(
							(sensor: any) => {
								if (sensor.lastMeasurement?.createdAt) {
									const measurementDate = new Date(
										sensor.lastMeasurement.createdAt,
									)
									const filterDate = new Date(tenDaysAgoIso)
									return measurementDate >= filterDate
								}
								return false
							},
						)

						// If there are sensors with lastMeasurement, at least one should be recent
						if (
							feature.properties.sensors.some(
								(s: any) => s.lastMeasurement?.createdAt,
							)
						) {
							expect(hasRecentMeasurement).toBe(true)
						}
					}
				})
			}
		})

		it('should reject filtering boxes near a location with wrong parameter values', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?near=test,60`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act & Assert
			await expect(async () => {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
			}).rejects.toThrow()
		})

		it('should return 422 error on wrong format parameter', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=potato`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			try {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
				expect(true).toBe(false)
			} catch (error) {
				expect(error).toBeInstanceOf(Response)
				expect((error as Response).status).toBe(422)

				const errorData = await (error as Response).json()
				expect(errorData.error).toBe('Invalid format parameter')
			}
		})

		it('should return geojson format when requested', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=geojson`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const geojsonData: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			expect(geojsonData).toBeDefined()
			if (geojsonData) {
				// Assert - this should always be GeoJSON since that's what the loader returns
				expect(geojsonData.type).toBe('FeatureCollection')
				expect(Array.isArray(geojsonData.features)).toBe(true)

				if (geojsonData.features.length > 0) {
					expect(geojsonData.features[0].type).toBe('Feature')
					expect(geojsonData.features[0].geometry).toBeDefined()
					// @ts-ignore
					expect(geojsonData.features[0].geometry.coordinates[0]).toBeDefined()
					// @ts-ignore
					expect(geojsonData.features[0].geometry.coordinates[1]).toBeDefined()
					expect(geojsonData.features[0].properties).toBeDefined()
				}
			}
		})

		it('should allow to filter boxes by grouptag', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?grouptag=${grouptag}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const response = await loader({ request } as LoaderFunctionArgs)

			// Handle case where loader returned a Response (e.g. validation error)
			const data =
				response instanceof Response ? await response.json() : response

			expect(data).toBeDefined()
			expect(Array.isArray(data)).toBe(true)

			expect(data).toHaveLength(1)

			if (response instanceof Response) {
				expect(response.status).toBe(200)
				expect(response.headers.get('content-type')).toMatch(
					/application\/json/,
				)
			}
		})

		it('should allow filtering boxes by bounding box', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&bbox=120,60,121,61`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			const response: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			expect(response).toBeDefined()

			if (response) {
				// Assert
				expect(response.type).toBe('FeatureCollection')
				expect(Array.isArray(response.features)).toBe(true)

				if (response.features.length > 0) {
					response.features.forEach((feature: any) => {
						expect(feature.type).toBe('Feature')
						expect(feature.geometry).toBeDefined()
						expect(feature.geometry.coordinates).toBeDefined()

						const [longitude, latitude] = feature.geometry.coordinates

						// Verify coordinates are within the bounding box [120,60,121,61]
						expect(longitude).toBeGreaterThanOrEqual(120)
						expect(longitude).toBeLessThanOrEqual(121)
						expect(latitude).toBeGreaterThanOrEqual(60)
						expect(latitude).toBeLessThanOrEqual(61)
					})
				}
			}
		})

		it('should reject filtering boxes near a location with wrong parameter values', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?near=test,60`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act & Assert
			await expect(async () => {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
			}).rejects.toThrow()
		})

		it('should return 422 error on wrong format parameter', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=potato`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			try {
				await loader({
					request: request,
				} as LoaderFunctionArgs)
				expect(true).toBe(false)
			} catch (error) {
				expect(error).toBeInstanceOf(Response)
				expect((error as Response).status).toBe(422)

				const errorData = await (error as Response).json()
				expect(errorData.error).toBe('Invalid format parameter')
			}
		})

		it('should return geojson format when requested', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=geojson`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const geojsonData: any = await loader({
				request: request,
			} as LoaderFunctionArgs)

			expect(geojsonData).toBeDefined()
			if (geojsonData) {
				// Assert - this should always be GeoJSON since that's what the loader returns
				expect(geojsonData.type).toBe('FeatureCollection')
				expect(Array.isArray(geojsonData.features)).toBe(true)

				if (geojsonData.features.length > 0) {
					expect(geojsonData.features[0].type).toBe('Feature')
					expect(geojsonData.features[0].geometry).toBeDefined()
					// @ts-ignore
					expect(geojsonData.features[0].geometry.coordinates[0]).toBeDefined()
					// @ts-ignore
					expect(geojsonData.features[0].geometry.coordinates[1]).toBeDefined()
					expect(geojsonData.features[0].properties).toBeDefined()
				}
			}
		})
	})

	describe('POST', () => {
		it('should create a new box with sensors', async () => {
			const requestBody = {
				name: 'Test Weather Station',
				location: [7.596, 51.969],
				exposure: 'outdoor',
				// model: 'custom',
				grouptag: ['weather', 'test'],
				sensors: [
					{
						id: '0',
						title: 'Temperature',
						unit: '°C',
						sensorType: 'HDC1080',
					},
					{
						id: '1',
						title: 'Humidity',
						unit: '%',
						sensorType: 'HDC1080',
					},
				],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			if (body._id) {
				createdDeviceIds.push(body._id)
			}

			expect(response.status).toBe(201)
			expect(body).toHaveProperty('_id')
			expect(body).toHaveProperty('name', 'Test Weather Station')
			expect(body.sensors).toHaveLength(2)
			expect(body).toHaveProperty('sensors')
			expect(body.sensors[0]).toHaveProperty('title', 'Temperature')
			expect(body.sensors[1]).toHaveProperty('title', 'Humidity')
			expect(body).toHaveProperty('access_token')
			expect(body.access_token).not.toBeNull()
		})

		it('should create a box with minimal data (no sensors)', async () => {
			const requestBody = {
				name: 'Minimal Test Box',
				location: [7.5, 51.9],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			if (body._id) {
				createdDeviceIds.push(body._id)
			}

			expect(response.status).toBe(201)
			expect(body).toHaveProperty('_id')
			expect(body).toHaveProperty('name', 'Minimal Test Box')
			expect(body).toHaveProperty('sensors')
			expect(Array.isArray(body.sensors)).toBe(true)
			expect(body.sensors).toHaveLength(0)
		})

		it('should reject creation without authentication', async () => {
			const requestBody = {
				name: 'Unauthorized Box',
				location: [7.5, 51.9],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(403)
			expect(body).toHaveProperty('code', 'Forbidden')
			expect(body).toHaveProperty('message')
		})

		it('should reject creation with invalid JWT', async () => {
			const requestBody = {
				name: 'Invalid JWT Box',
				location: [7.5, 51.9],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: 'Bearer invalid_jwt_token',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(403)
			expect(body).toHaveProperty('code', 'Forbidden')
		})

		it('should reject creation with missing required fields', async () => {
			const requestBody = {
				location: [7.5, 51.9],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body).toHaveProperty('code', 'Bad Request')
			expect(body).toHaveProperty('errors')
			expect(Array.isArray(body.errors)).toBe(true)
		})

		it('should reject creation with invalid location format', async () => {
			const requestBody = {
				name: 'Invalid Location Box',
				location: [7.5],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body).toHaveProperty('code', 'Bad Request')
			expect(body).toHaveProperty('errors')
		})

		it('should reject creation with invalid JSON', async () => {
			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: 'invalid json {',
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(400)
			expect(body).toHaveProperty('code', 'Bad Request')
			expect(body).toHaveProperty('message', 'Invalid JSON in request body')
		})

		it('should create box with default values for optional fields', async () => {
			const requestBody = {
				name: 'Default Values Box',
				location: [7.5, 51.9],
			}

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			if (body._id) {
				createdDeviceIds.push(body._id)
			}

			expect(response.status).toBe(201)
			expect(body).toHaveProperty('exposure', 'unknown')
			expect(body).toHaveProperty('model', 'custom')
			expect(body).toHaveProperty('grouptag')
			expect(body.grouptag).toEqual([])
		})

		it('should allow to set the location for a new box as array', async () => {
			// Arrange
			const loc = [0, 0, 0]
			const requestBody = generateMinimalDevice(loc)

			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			// Act
			const response = await action({
				request: request,
			} as ActionFunctionArgs)
			const responseData = await response.json()
			await deleteDevice({ id: responseData._id })

			// Assert
			expect(response.status).toBe(201)
			expect(responseData.latitude).toBeDefined()
			expect(responseData.longitude).toBeDefined()
			expect(responseData.latitude).toBe(loc[0])
			expect(responseData.longitude).toBe(loc[1])
			expect(responseData.createdAt).toBeDefined()

			// Check that createdAt is recent (within 5 minutes)
			const now = new Date()
			const createdAt = new Date(responseData.createdAt)
			const diffInMs = now.getTime() - createdAt.getTime()
			expect(diffInMs).toBeLessThan(300000) // 5 minutes in milliseconds
		})

		it('should allow to set the location for a new box as latLng object', async () => {
			// Arrange
			const loc = { lng: 120.123456, lat: 60.654321 }
			const requestBody = generateMinimalDevice(loc)

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },
				body: JSON.stringify(requestBody),
			})

			// Act
			const response = await action({
				request: request,
			} as ActionFunctionArgs)
			const responseData = await response.json()
			await deleteDevice({ id: responseData._id })

			// Assert
			expect(response.status).toBe(201)
			expect(responseData.latitude).toBeDefined()
			expect(responseData.latitude).toBe(loc.lat)
			expect(responseData.longitude).toBeDefined()
			expect(responseData.longitude).toBe(loc.lng)
			expect(responseData.createdAt).toBeDefined()

			// Check that createdAt is recent (within 5 minutes)
			const now = new Date()
			const createdAt = new Date(responseData.createdAt)
			const diffInMs = now.getTime() - createdAt.getTime()
			expect(diffInMs).toBeLessThan(300000) // 5 minutes in milliseconds
		})

		it('should reject a new box with invalid coords', async () => {
			function minimalSensebox(coords: number[]) {
				return {
					name: 'Test Box',
					location: coords,
					sensors: [],
				}
			}

			const requestBody = minimalSensebox([52])

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(requestBody),
			})

			try {
				await action({ request } as ActionFunctionArgs)
			} catch (error) {
				if (error instanceof Response) {
					expect(error.status).toBe(422)

					const errorData = await error.json()
					expect(errorData.message).toBe(
						'Illegal value for parameter location. missing latitude or longitude in location [52]',
					)
				} else {
					throw error
				}
			}
		})

		it('should reject a new box without location field', async () => {
			// Arrange
			function minimalSensebox(coords: number[]): {
				name: string
				location?: number[]
				sensors: any[]
			} {
				return {
					name: 'Test Box',
					location: coords,
					sensors: [],
				}
			}

			const requestBody = minimalSensebox([52])
			delete requestBody.location

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },

				body: JSON.stringify(requestBody),
			})

			// Act & Assert
			try {
				await action({
					request: request,
				} as ActionFunctionArgs)
			} catch (error) {
				if (error instanceof Response) {
					expect(error.status).toBe(400)
					const errorData = await error.json()
					expect(errorData.message).toBe('missing required parameter location')
				} else {
					throw error
				}
			}
		})
	})

	describe('Method Not Allowed', () => {
		it('should return 405 for GET requests', async () => {
			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(405)
			expect(body).toHaveProperty('message', 'Method Not Allowed')
		})

		it('should return 405 for PUT requests', async () => {
			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: 'Test' }),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(405)
			expect(body).toHaveProperty('message', 'Method Not Allowed')
		})

		it('should return 405 for DELETE requests', async () => {
			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(405)
			expect(body).toHaveProperty('message', 'Method Not Allowed')
		})

		it('should return 405 for PATCH requests', async () => {
			const request = new Request(`${BASE_URL}/boxes`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${jwt}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: 'Test' }),
			})

			const response = (await action({
				request,
			} as ActionFunctionArgs)) as Response
			const body = await response.json()

			expect(response.status).toBe(405)
			expect(body).toHaveProperty('message', 'Method Not Allowed')
		})
	})
})
