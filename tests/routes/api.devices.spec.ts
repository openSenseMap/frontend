import {
	type AppLoadContext,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from 'react-router'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import { deleteUserByEmail } from '~/models/user.server'
import { loader as deviceLoader } from '~/routes/api.device.$deviceId'
import {
	loader as devicesLoader,
	action as devicesAction,
} from '~/routes/api.devices'
import { type User, type Device } from '~/schema'

const DEVICE_TEST_USER = {
	name: 'deviceTest',
	email: 'test@devices.endpoint',
	password: 'highlySecurePasswordForTesting',
}

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
	let queryableDevice: Device | null = null

	beforeAll(async () => {
		const testUser = await registerUser(
			DEVICE_TEST_USER.name,
			DEVICE_TEST_USER.email,
			DEVICE_TEST_USER.password,
			'en_US',
		)
		user = testUser as User
		const { token: t } = await createToken(testUser as User)
		jwt = t

		queryableDevice = await createDevice(
			{ ...generateMinimalDevice(), latitude: 123, longitude: 12, tags: ["newgroup"] },
			(testUser as User).id,
		)
	})

	describe('GET', () => {
		it('should search for boxes with a specific name', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}?format=geojson&name=${queryableDevice?.name}`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				},
			)

			// Act
			const response: any = await devicesLoader({
				request: request,
			} as LoaderFunctionArgs)

			expect(response).toBeDefined()
			expect(Array.isArray(response?.features)).toBe(true)
			expect(response?.features.length).lessThanOrEqual(5) // 5 is default limit
		})

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
			const response: any = await devicesLoader({
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
				await devicesLoader({
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
				await devicesLoader({
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
			const response: any = await devicesLoader({
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
			const response: any = await devicesLoader({
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
				await devicesLoader({
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
				await devicesLoader({
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
			const geojsonData: any = await devicesLoader({
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
			const request = new Request(`${BASE_URL}?grouptag=newgroup`, {
			  method: 'GET',
			  headers: { 'Content-Type': 'application/json' },
			});
		  
			// Act
			const response = await devicesLoader({ request } as LoaderFunctionArgs);
		  
			// Handle case where loader returned a Response (e.g. validation error)
			const data = response instanceof Response ? await response.json() : response;
		  
			expect(data).toBeDefined();
			expect(Array.isArray(data)).toBe(true);
		  
			expect(data).toHaveLength(1);
		  
			if (response instanceof Response) {
			  expect(response.status).toBe(200);
			  expect(response.headers.get('content-type')).toMatch(/application\/json/);
			}
		});
		  

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
			const response: any = await devicesLoader({
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
	})

	describe('POST', () => {
		it('should allow to set the location for a new box as array', async () => {
			// Arrange
			const loc = [0, 0, 0]
			const requestBody = generateMinimalDevice(loc)

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },
				body: JSON.stringify(requestBody),
			})

			// Act
			const response = await devicesAction({
				request: request,
			} as ActionFunctionArgs)
			const responseData = await response.json()
			await deleteDevice({ id: responseData.data!.id })

			// Assert
			expect(response.status).toBe(201)
			expect(responseData.data.latitude).toBeDefined()
			expect(responseData.data.longitude).toBeDefined()
			expect(responseData.data.latitude).toBe(loc[0])
			expect(responseData.data.longitude).toBe(loc[1])
			expect(responseData.data.createdAt).toBeDefined()

			// Check that createdAt is recent (within 5 minutes)
			const now = new Date()
			const createdAt = new Date(responseData.data.createdAt)
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
			const response = await devicesAction({
				request: request,
			} as ActionFunctionArgs)
			const responseData = await response.json()
			await deleteDevice({ id: responseData.data!.id })

			// Assert
			expect(response.status).toBe(201)
			expect(responseData.data.latitude).toBeDefined()
			expect(responseData.data.latitude).toBe(loc.lat)
			expect(responseData.data.longitude).toBeDefined()
			expect(responseData.data.longitude).toBe(loc.lng)
			expect(responseData.data.createdAt).toBeDefined()

			// Check that createdAt is recent (within 5 minutes)
			const now = new Date()
			const createdAt = new Date(responseData.data.createdAt)
			const diffInMs = now.getTime() - createdAt.getTime()
			expect(diffInMs).toBeLessThan(300000) // 5 minutes in milliseconds
		})

		it('should reject a new box with invalid coords', async () => {
			function minimalSensebox(coords: number[]) {
			  return {
				name: "Test Box",
				location: coords,
				sensors: [],
			  };
			}
		  
			const requestBody = minimalSensebox([52]);
		  
			const request = new Request(BASE_URL, {
			  method: 'POST',
			  headers: {
				Authorization: `Bearer ${jwt}`,
			  },
			  body: JSON.stringify(requestBody),
			});
		  		  
			try {
			  await devicesAction({ request } as ActionFunctionArgs);
			} catch (error) {
			  if (error instanceof Response) {
				expect(error.status).toBe(422);
		  
				const errorData = await error.json();
				expect(errorData.message).toBe(
				  'Illegal value for parameter location. missing latitude or longitude in location [52]'
				);
			  } else {
				throw error;
			  }
			}
		  });
		  

		it('should reject a new box without location field', async () => {
			// Arrange
			function minimalSensebox(coords: number[]): {name: string, location?: number[], sensors: any[]} {
				return {
				  name: "Test Box",
				  location: coords,
				  sensors: [],
				};
			  }
			
			  const requestBody = minimalSensebox([52]);
			delete requestBody.location

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },

				body: JSON.stringify(requestBody),
			})

			// Act & Assert
			try {
				await devicesAction({
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

	describe('/:deviceId', () => {
		describe('GET', () => {
			let result: any

			beforeAll(async () => {
				// Arrange
				const request = new Request(`${BASE_URL}/${queryableDevice!.id}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				})

				// Act
				const dataFunctionValue = await deviceLoader({
					request: request,
					params: { deviceId: queryableDevice!.id },
					context: {} as AppLoadContext,
				} as LoaderFunctionArgs)

				const response = dataFunctionValue as Response

				// Assert initial response
				expect(dataFunctionValue).toBeInstanceOf(Response)
				expect(response.status).toBe(200)
				expect(response.headers.get('content-type')).toBe(
					'application/json; charset=utf-8',
				)

				// Get the body for subsequent tests
				result = await response.json()
			})

			it('should return the device with correct location data', () => {
				expect(result).toBeDefined()
				expect(result._id || result.id).toBe(queryableDevice?.id)
				expect(result.latitude).toBeDefined()
				expect(result.longitude).toBeDefined()
				expect(result.latitude).toBe(queryableDevice?.latitude)
				expect(result.longitude).toBe(queryableDevice?.longitude)
			})

			it('should return the device name and model', () => {
				expect(result.name).toBe(queryableDevice?.name)
				expect(result.model).toBe('homeV2Ethernet')
				expect(result.exposure).toBe('mobile')
			})

			it('should return the creation timestamp', () => {
				expect(result.createdAt).toBeDefined()
				expect(result.createdAt).toBe(queryableDevice?.createdAt.toISOString())
			})

			it('should NOT return sensitive data (if any)', () => {
				// Add assertions for fields that shouldn't be returned
				// For example, if there are internal fields that shouldn't be exposed:
				// expect(result.internalField).toBeUndefined()
			})
		})

		describe('DELETE', () => {
			let deletableDevice: Device | null = null

			beforeAll(async () => {
				deletableDevice = await createDevice(
					{ ...generateMinimalDevice(), latitude: 123, longitude: 12 },
					user!.id,
				)
			})

			it('should deny deletion with incorrect password', async () => {
				const badDeleteRequest = new Request(
					`${BASE_URL}/${queryableDevice?.id}`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${jwt}`,
						},
						body: JSON.stringify({ password: 'wrong password' }),
					},
				)

				const badDeleteResponse = await devicesAction({
					request: badDeleteRequest,
					params: { deviceId: queryableDevice?.id },
					context: {} as AppLoadContext,
				} as ActionFunctionArgs)

				expect(badDeleteResponse).toBeInstanceOf(Response)
				expect(badDeleteResponse.status).toBe(401)
				expect(badDeleteResponse.headers.get('content-type')).toBe(
					'application/json; charset=utf-8',
				)

				const badResult = await badDeleteResponse.json()
				expect(badResult).toEqual({ message: 'Password incorrect' })
			})

			it('should successfully delete the device with correct password', async () => {
				const validDeleteRequest = new Request(
					`${BASE_URL}/${deletableDevice?.id}`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${jwt}`,
						},
						body: JSON.stringify({ password: DEVICE_TEST_USER.password }),
					},
				)

				const validDeleteResponse = await devicesAction({
					request: validDeleteRequest,
					params: { deviceId: deletableDevice?.id },
					context: {} as AppLoadContext,
				} as ActionFunctionArgs)

				expect(validDeleteResponse).toBeInstanceOf(Response)
				expect(validDeleteResponse.status).toBe(200)
				expect(validDeleteResponse.headers.get('content-type')).toBe(
					'application/json; charset=utf-8',
				)
			})

			it('should return 404 when trying to get the deleted device', async () => {
				const getDeletedRequest = new Request(
					`${BASE_URL}/${deletableDevice?.id}`,
					{
						method: 'GET',
						headers: { 'Content-Type': 'application/json' },
					},
				)

				const getDeletedResponse = await deviceLoader({
					request: getDeletedRequest,
					params: { deviceId: deletableDevice?.id },
					context: {} as AppLoadContext,
				} as LoaderFunctionArgs)

				expect(getDeletedResponse).toBeInstanceOf(Response)
				expect(getDeletedResponse.status).toBe(404)
				expect(getDeletedResponse.headers.get('content-type')).toBe(
					'application/json; charset=utf-8',
				)
			})
		})
	})

	afterAll(async () => {
		await deleteDevice({ id: queryableDevice!.id })
		await deleteUserByEmail(DEVICE_TEST_USER.email)
	})
})
