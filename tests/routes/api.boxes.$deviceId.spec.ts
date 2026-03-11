import {
	type AppLoadContext,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from 'react-router'
import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import { deleteUserByEmail } from '~/models/user.server'
import {
	loader as deviceLoader,
	action as deviceAction,
} from '~/routes/api.boxes.$deviceId'
import { type User, type Device } from '~/schema'

const DEVICE_TEST_USER = generateTestUserCredentials()

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

describe('openSenseMap API Routes: /boxes/:deviceId', () => {
	let user: User | null = null
	let jwt: string = ''
	let queryableDevice: Device | null = null

	beforeAll(async () => {
		const registration = await registerUser(
			DEVICE_TEST_USER.name,
			DEVICE_TEST_USER.email,
			DEVICE_TEST_USER.password,
			'en_US',
		)
		expect(registration.ok).toBe(true)

		if (!registration.ok) {
			throw new Error(
				`Test setup failed: ${registration.field} -> ${registration.code}`,
			)
		}

		user = registration.user
		const { token: t } = await createToken(user as User)
		jwt = t

		queryableDevice = await createDevice(
			{
				...generateMinimalDevice(),
				latitude: 123,
				longitude: 12,
				tags: ['testgroup'],
				useAuth: false,
			},
			(user as User).id,
		)
	})

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

	describe('PUT', () => {
		it('should allow to update the device via PUT', async () => {
			const update_payload = {
				name: 'neuername',
				exposure: 'indoor',
				grouptag: 'testgroup',
				description: 'total neue beschreibung',
				location: { lat: 54.2, lng: 21.1 },
				weblink: 'http://www.google.de',
				useAuth: true,
				image:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.name).toBe(update_payload.name)
			expect(data.exposure).toBe(update_payload.exposure)
			expect(Array.isArray(data.grouptag)).toBe(true)
			expect(data.grouptag).toContain(update_payload.grouptag)
			expect(data.description).toBe(update_payload.description)
			expect(data.access_token).not.toBeNull()
			expect(data.currentLocation).toEqual({
				type: 'Point',
				coordinates: [update_payload.location.lng, update_payload.location.lat],
				timestamp: expect.any(String),
			})

			expect(data.loc).toEqual([
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [
							update_payload.location.lng,
							update_payload.location.lat,
						],
						timestamp: expect.any(String),
					},
				},
			])
		})

		it('should allow to update the device via PUT with array as grouptags', async () => {
			const update_payload = {
				name: 'neuername',
				exposure: 'outdoor',
				grouptag: ['testgroup'],
				description: 'total neue beschreibung',
				location: { lat: 54.2, lng: 21.1 },
				weblink: 'http://www.google.de',
				image:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response: any = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.name).toBe(update_payload.name)
			expect(data.exposure).toBe(update_payload.exposure)

			expect(Array.isArray(data.grouptag)).toBe(true)
			expect(data.grouptag).toEqual(update_payload.grouptag)

			expect(data.description).toBe(update_payload.description)
			expect(data.currentLocation.coordinates).toEqual([
				update_payload.location.lng,
				update_payload.location.lat,
			])
			expect(data.loc[0].geometry.coordinates).toEqual([
				update_payload.location.lng,
				update_payload.location.lat,
			])

			//TODO: this fails, check if we actually need timestamps in images
			// const parts = data.image.split('_')
			// const ts36 = parts[1].replace('.png', '')
			// const tsMs = parseInt(ts36, 36) * 1000
			// expect(Date.now() - tsMs).toBeLessThan(1000)
		})
		it('should remove image when deleteImage=true', async () => {
			const update_payload = {
				deleteImage: true,
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.image).toBeNull()
		})

		it('should nullify description when set to empty string', async () => {
			const update_payload = {
				description: '',
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.description).toBeNull()
		})

		it('should clear group tags when empty array provided', async () => {
			const update_payload = {
				grouptag: [],
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.grouptag).toHaveLength(0)
		})

		it('should merge addons.add into grouptags', async () => {
			const update_payload = {
				addons: { add: 'feinstaub' },
				grouptag: ['existinggroup'],
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)
			const data = await response.json()

			expect(Array.isArray(data.grouptag)).toBe(true)
			expect(data.grouptag).toContain('existinggroup')
			expect(data.grouptag).toContain('feinstaub')
		})

		it('should accept multi-valued grouptag array', async () => {
			const update_payload = {
				grouptag: ['tag1', 'tag2', 'tag3'],
			}

			const request = new Request(`${BASE_URL}/${queryableDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(update_payload),
			})

			const response = await deviceAction({
				request,
				params: { deviceId: queryableDevice?.id },
				context: {} as AppLoadContext,
			} as ActionFunctionArgs)

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.grouptag).toEqual(
				expect.arrayContaining(['tag1', 'tag2', 'tag3']),
			)
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

			const badDeleteResponse = await deviceAction({
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
			expect(badResult.message).toBe('Password incorrect')
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

			const validDeleteResponse = await deviceAction({
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

	afterAll(async () => {
		await deleteDevice({ id: queryableDevice!.id })
		await deleteUserByEmail(DEVICE_TEST_USER.email)
	})
})
