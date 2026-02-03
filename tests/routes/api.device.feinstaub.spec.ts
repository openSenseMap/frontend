import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice, getDevice } from '~/models/device.server'
import { deleteUserByEmail } from '~/models/user.server'
import { action as deviceUpdateAction } from '~/routes/api.device.$deviceId'
import { type User, type Device } from '~/schema'

const TEST_USER = {
	name: 'feinstaubAddonUpdateTestUser',
	email: 'feinstaubUpdate.addon@test',
	password: 'secureTestPassword123!',
}

let user: User
let jwt: string
let baseDevice: Device

const generateMinimalDevice = (model = 'homeEthernetFeinstaub') => ({
	exposure: 'mobile',
	latitude: 12.34,
	longitude: 56.78,
	name: 'senseBox' + Date.now(),
	model: model,
})

describe('Device API: Feinstaub Addon behavior', () => {
	let queryableDevice: Device | null = null

	beforeAll(async () => {
		const testUser = await registerUser(
			TEST_USER.name,
			TEST_USER.email,
			TEST_USER.password,
			'en_US',
		)
		user = testUser as User
		const { token: t } = await createToken(testUser as User)
		jwt = t

		queryableDevice = await createDevice(
			{
				...generateMinimalDevice(),
				latitude: 123,
				longitude: 12,
				tags: ['newgroup'],
			},
			(testUser as User).id,
		)
	})

	afterAll(async () => {
		await deleteUserByEmail(TEST_USER.email)
		await deleteDevice({ id: queryableDevice!.id })
	})

	it('should allow to register a homeEthernetFeinstaub device and include SDS011 sensors', async () => {
		const device = await createDevice(generateMinimalDevice(), user.id)

		const fetched = await getDevice({ id: device.id })
		expect(fetched).toBeDefined()

		const hasPM10 = fetched!.sensors.some(
			(s) => s.sensorType === 'SDS 011' && s.title === 'PM10',
		)
		const hasPM25 = fetched!.sensors.some(
			(s) => s.sensorType === 'SDS 011' && s.title === 'PM2.5',
		)

		expect(hasPM10).toBe(true)
		expect(hasPM25).toBe(true)

		await deleteDevice({ id: device.id })
	})

	it('should allow to register a homeWifiFeinstaub device and include SDS011 sensors', async () => {
		const device = await createDevice(
			generateMinimalDevice('homeWifiFeinstaub'),
			user.id,
		)

		const fetched = await getDevice({ id: device.id })
		expect(fetched).toBeDefined()

		const hasPM10 = fetched!.sensors.some(
			(s) => s.sensorType === 'SDS 011' && s.title === 'PM10',
		)
		const hasPM25 = fetched!.sensors.some(
			(s) => s.sensorType === 'SDS 011' && s.title === 'PM2.5',
		)

		expect(hasPM10).toBe(true)
		expect(hasPM25).toBe(true)

		await deleteDevice({ id: device.id })
	})

	it('should allow to add the feinstaub addon via PUT for a homeWifi device', async () => {
		const device = await createDevice(
			generateMinimalDevice('homeWifiFeinstaub'),
			user.id,
		)

		const updatePayload = { addons: { add: 'feinstaub' } }

		const request = new Request(`${BASE_URL}/${device.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${jwt}`,
			},
			body: JSON.stringify(updatePayload),
		}) as unknown as Request

		const response: any = await deviceUpdateAction({
			request,
			params: { deviceId: device.id },
			context: {} as any,
		})

		expect(response.status).toBe(200)
		const data = await response.json()

		expect(data.model).toBe('homeWifiFeinstaub')

		const hasPM10 = data.sensors.some(
			(s: any) => s.sensorType === 'SDS 011' && s.title === 'PM10',
		)
		const hasPM25 = data.sensors.some(
			(s: any) => s.sensorType === 'SDS 011' && s.title === 'PM2.5',
		)

		expect(hasPM10).toBe(true)
		expect(hasPM25).toBe(true)

		const secondRequest = new Request(`${BASE_URL}/${device.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${jwt}`,
			},
			body: JSON.stringify(updatePayload),
		}) as unknown as Request

		// Second PUT should be idempotent — same sensors
		const secondResponse: any = await deviceUpdateAction({
			request: secondRequest,
			params: { deviceId: device.id },
			context: {} as any,
		})

		expect(secondResponse.status).toBe(200)
		const secondData = await secondResponse.json()
		expect(secondData.sensors).toEqual(data.sensors)

		await deleteDevice({ id: device.id })
	})

	it('should do nothing when adding the feinstaub addon to a non-home device', async () => {
		const device = await createDevice(
			{
				...generateMinimalDevice('custom'),
				// sensors: [{ title: 'temp', unit: 'K', sensorType: 'some Sensor' }],
			},
			user.id,
		)

		const updatePayload = { addons: { add: 'feinstaub' } }

		const request = new Request(`${BASE_URL}/${device.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${jwt}`,
			},
			body: JSON.stringify(updatePayload),
		}) as unknown as Request

		const response: any = await deviceUpdateAction({
			request,
			params: { deviceId: device.id },
			context: {} as any,
		})

		expect(response.status).toBe(200)
		const data = await response.json()

		// Model should not change
		expect(data.model).toBe('custom')

		// Should not have SDS011 sensors
		const hasPM10 = data.sensors.some(
			(s: any) => s.sensorType === 'SDS 011' && s.title === 'PM10',
		)
		const hasPM25 = data.sensors.some(
			(s: any) => s.sensorType === 'SDS 011' && s.title === 'PM2.5',
		)
		expect(hasPM10).toBe(false)
		expect(hasPM25).toBe(false)

		await deleteDevice({ id: device.id })
	})
})
