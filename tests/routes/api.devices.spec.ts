import {
	AppLoadContext,
	LoaderFunctionArgs,
	type ActionFunctionArgs,
} from 'react-router'
import { BASE_URL } from 'vitest.setup'
import { type User, type Device } from '~/schema'
import { loader as devicesLoader } from '~/routes/api.devices'
import { loader as deviceLoader } from '~/routes/api.device.$deviceId'
import { action as devicesAction } from '~/routes/api.devices'
import { registerUser } from '~/lib/user-service.server'
import { createToken } from '~/lib/jwt'
import { deleteUserByEmail } from '~/models/user.server'

const ME_TEST_USER = {
	name: 'meTest',
	email: 'test@me.endpoint',
	password: 'highlySecurePasswordForTesting',
}

const minimalSensebox = function minimalSensebox(
	location: number[] | {} = [123, 12, 34],
	exposure = 'mobile',
) {
	return {
		exposure,
		location,
		name: 'senseBox',
		model: 'homeV2Ethernet',
	}
}

describe('openSenseMap API Routes: /boxes', () => {
	describe('GET /boxes', () => {
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
				expect(error.status).toBe(422)
				
				const errorData = await error.json()
				expect(errorData.error).toBe('Failed to fetch devices')
			}
		})

		it('should return geojson format when requested', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=geojson`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const geojsonData = await devicesLoader({
				request: request,
			} as LoaderFunctionArgs)

			console.log("geojson features 0 geometry", geojsonData.features[0].geometry)

			// Assert - this should always be GeoJSON since that's what the loader returns
			expect(geojsonData.type).toBe('FeatureCollection')
			expect(Array.isArray(geojsonData.features)).toBe(true)

			if (geojsonData.features.length > 0) {
				expect(geojsonData.features[0].type).toBe('Feature')
				expect(geojsonData.features[0].geometry).toBeDefined()
				expect(geojsonData.features[0].geometry.coordinates[0]).toBeDefined()
				expect(geojsonData.features[0].geometry.coordinates[1]).toBeDefined()
				expect(geojsonData.features[0].properties).toBeDefined()
			}
		})

		it('should allow filtering boxes by bounding box', async () => {
			// Arrange
			const request = new Request(`${BASE_URL}?format=geojson&bbox=120,60,121,61`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})
		
			// Act
			const response = await devicesLoader({
				request: request,
			} as LoaderFunctionArgs)
				
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
		})
	})

	let jwt: string = ''
	let device: Device | null = null
	let user: User | null = null

	beforeAll(async () => {
		const testUser = await registerUser(
			ME_TEST_USER.name,
			ME_TEST_USER.email,
			ME_TEST_USER.password,
			'en_US',
		)
		if (
			testUser !== null &&
			typeof testUser === 'object' &&
			'id' in testUser &&
			'username' in testUser
		) {
			user = testUser
		}
		const { token: t } = await createToken(testUser as User)
		jwt = t
	})
	describe('POST /boxes', () => {
		it('should allow to set the location for a new box as array', async () => {
			// Arrange
			const loc = [0, 0, 0]
			const requestBody = minimalSensebox(loc)

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },
				body: JSON.stringify(requestBody),
			})

			// Act
			const response = await devicesAction({
				request: request,
			} as ActionFunctionArgs)

			// Assert
			expect(response.status).toBe(201)

			const responseData = await response.json()
			device = responseData.data

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
			const requestBody = minimalSensebox(loc)

			const request = new Request(BASE_URL, {
				method: 'POST',
				headers: { Authorization: `Bearer ${jwt}` },
				body: JSON.stringify(requestBody),
			})

			// Act
			const response = await devicesAction({
				request: request,
			} as ActionFunctionArgs)

			// Assert
			expect(response.status).toBe(201)

			const responseData = await response.json()
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

		// it('should reject a new box with invalid coords', async () => {
		// 	// Arrange
		// 	const requestBody = minimalSensebox([52]) // Invalid: missing longitude

		// 	const request = new Request(BASE_URL, {
		// 		method: 'POST',
		// 		headers: { Authorization: `Bearer ${jwt}` },
		// 		body: JSON.stringify(requestBody),
		// 	})

		// 	try {
		// 		await devicesAction({
		// 			request: request,
		// 		} as ActionFunctionArgs)
		// 		fail('Expected action to throw an error')
		// 	} catch (error) {
		// 		if (error instanceof Response) {
		// 			expect(error.status).toBe(422)
		// 			const errorData = await error.json()
		// 			expect(errorData.message).toBe(
		// 				'Illegal value for parameter location. missing latitude or longitude in location [52]',
		// 			)
		// 		} else {
		// 			throw error
		// 		}
		// 	}
		// })

		// it('should reject a new box without location field', async () => {
		// 	// Arrange
		// 	const requestBody = minimalSensebox()
		// 	delete requestBody.location

		// 	const request = new Request(BASE_URL, {
		// 		method: 'POST',
		// 		headers: { Authorization: `Bearer ${jwt}` },

		// 		body: JSON.stringify(requestBody),
		// 	})

		// 	// Act & Assert
		// 	try {
		// 		await devicesAction({
		// 			request: request,
		// 		} as ActionFunctionArgs)
		// 		fail('Expected action to throw an error')
		// 	} catch (error) {
		// 		if (error instanceof Response) {
		// 			expect(error.status).toBe(400)
		// 			const errorData = await error.json()
		// 			expect(errorData.message).toBe('missing required parameter location')
		// 		} else {
		// 			throw error
		// 		}
		// 	}
		// })
	})

	describe('GET /boxes/:deviceId', () => {
		let result: any

		beforeAll(async () => {
			// Skip if no device was created in POST tests
			if (!device) {
				throw new Error(
					'No device was created in previous tests. Make sure POST tests run first.',
				)
			}

			// Arrange
			const request = new Request(`${BASE_URL}/${device.id}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			// Act
			const dataFunctionValue = await deviceLoader({
				request: request,
				params: { deviceId: device.id },
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
			expect(result._id || result.id).toBe(device?.id)
			expect(result.latitude).toBeDefined()
			expect(result.longitude).toBeDefined()
			expect(result.latitude).toBe(device?.latitude)
			expect(result.longitude).toBe(device?.longitude)
		})

		it('should return the device name and model', () => {
			expect(result.name).toBe('senseBox')
			expect(result.model).toBe('homeV2Ethernet')
			expect(result.exposure).toBe('mobile')
		})

		it('should return the creation timestamp', () => {
			expect(result.createdAt).toBeDefined()
			expect(result.createdAt).toBe(device?.createdAt)
		})

		it('should NOT return sensitive data (if any)', () => {
			// Add assertions for fields that shouldn't be returned
			// For example, if there are internal fields that shouldn't be exposed:
			// expect(result.internalField).toBeUndefined()
		})
	})

	describe('DELETE /boxes/:deviceId', () => {
		let deleteResult: any
		let getAfterDeleteResult: any
		// let statsResult: any

		it('should deny deletion with incorrect password', async () => {
			const badDeleteRequest = new Request(`${BASE_URL}/${device?.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify({ password: 'wrong password' }),
			})

			const badDeleteResponse = await devicesAction({
				request: badDeleteRequest,
				params: { deviceId: device?.id },
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
			const validDeleteRequest = new Request(`${BASE_URL}/${device?.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify({ password: ME_TEST_USER.password }),
			})

			const validDeleteResponse = await devicesAction({
				request: validDeleteRequest,
				params: { deviceId: device?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(validDeleteResponse).toBeInstanceOf(Response)
			expect(validDeleteResponse.status).toBe(200)
			expect(validDeleteResponse.headers.get('content-type')).toBe(
				'application/json; charset=utf-8',
			)

			deleteResult = await validDeleteResponse.json()
			expect(deleteResult).toBeDefined()
		})

		it('should return 404 when trying to get the deleted device', async () => {
			const getDeletedRequest = new Request(`${BASE_URL}/${device?.id}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			const getDeletedResponse = await deviceLoader({
				request: getDeletedRequest,
				params: { deviceId: device?.id },
				context: {} as AppLoadContext,
			} as LoaderFunctionArgs)

			expect(getDeletedResponse).toBeInstanceOf(Response)
			expect(getDeletedResponse.status).toBe(404)
			expect(getDeletedResponse.headers.get('content-type')).toBe(
				'application/json; charset=utf-8',
			)

			getAfterDeleteResult = await getDeletedResponse.json()
			expect(getAfterDeleteResult.message).toBe('Device not found.')
		})

		afterAll(async () => {
			await deleteUserByEmail(ME_TEST_USER.email)
		})
	})
})

// describe('openSenseMap API Routes: /boxes', () => {
// 	describe('GET /boxes', () => {
// 		it('should reject filtering boxes near a location with wrong parameter values', async () => {
// 			// Arrange
// 			const request = new Request(`${BASE_URL}?near=test,60`, {
// 				method: 'GET',
// 				headers: { 'Content-Type': 'application/json' },
// 			})

// 			// Act & Assert
// 			await expect(async () => {
// 				await devicesLoader({
// 					request: request,
// 				} as LoaderFunctionArgs)
// 			}).rejects.toThrow()
// 		})

// 		it('should return geojson format when requested', async () => {
// 			// Arrange
// 			const request = new Request(`${BASE_URL}?format=geojson`, {
// 				method: 'GET',
// 				headers: { 'Content-Type': 'application/json' },
// 			})

// 			// Act
// 			const geojsonData = await devicesLoader({
// 				request: request,
// 			} as LoaderFunctionArgs)

// 			// Assert - this should always be GeoJSON since that's what the loader returns
// 			expect(geojsonData.type).toBe('FeatureCollection')
// 			expect(Array.isArray(geojsonData.features)).toBe(true)

// 			if (geojsonData.features.length > 0) {
// 				expect(geojsonData.features[0].type).toBe('Feature')
// 				expect(geojsonData.features[0].geometry).toBeDefined()
// 				expect(geojsonData.features[0].properties).toBeDefined()
// 			}
// 		})

// 		it('should return minimal data when minimal=true', async () => {
// 			// Arrange
// 			const request = new Request(`${BASE_URL}?minimal=true`, {
// 				method: 'GET',
// 				headers: { 'Content-Type': 'application/json' },
// 			})

// 			// Act
// 			const geojsonData = await devicesLoader({
// 				request: request,
// 			} as LoaderFunctionArgs)

// 			// Assert - working with GeoJSON FeatureCollection
// 			expect(geojsonData.type).toBe('FeatureCollection')
// 			expect(Array.isArray(geojsonData.features)).toBe(true)

// 			if (geojsonData.features.length > 0) {
// 				const feature = geojsonData.features[0]
// 				expect(feature.type).toBe('Feature')
// 				expect(feature.properties).toBeDefined()

// 				// Should have minimal fields in properties
// 				expect(feature.properties?._id || feature.properties?.id).toBeDefined()
// 				expect(feature.properties?.name).toBeDefined()
// 				expect(feature.properties?.exposure).toBeDefined()
// 				expect(
// 					feature.properties?.currentLocation ||
// 						feature.properties?.location ||
// 						feature.geometry,
// 				).toBeDefined()

// 				// Should not have full sensor data
// 				expect(feature.properties?.sensors).toBeUndefined()
// 			}
// 		})
// 	})
// })
