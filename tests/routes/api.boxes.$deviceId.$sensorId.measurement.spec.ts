import { ActionFunctionArgs, Params } from 'react-router'
import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import { insertMeasurements } from '~/models/measurement.server'
import { getSensors } from '~/models/sensor.server'
import { deleteUserByEmail } from '~/models/user.server'
import { action } from '~/routes/api.boxes.$deviceId.$sensorId.measurements'
import { sensor, type User } from '~/schema'

const USER = generateTestUserCredentials()
const USER2 = generateTestUserCredentials()
const DEVICE = {
	name: `${USER.name}s Box`,
	exposure: 'outdoor',
	expiresAt: null,
	tags: [],
	latitude: 0,
	longitude: 0,
	//model: 'luftdaten.info',
	mqttEnabled: false,
	ttnEnabled: false,
	sensors: [
		{
			title: 'Temp',
			unit: '°C',
			sensorType: 'dummy',
		},
	],
}

const MEASUREMENTS = [
	{
		value: 1589625,
		createdAt: new Date('1954-06-07 12:00:00+00'),
		sensor_id: '',
	},
	{
		value: 3.14159,
		createdAt: new Date('1988-03-14 1:59:26+00'),
		sensor_id: '',
	},
	{
		value: 6.62607,
		createdAt: new Date('2026-01-01 4:26:57+00'),
		sensor_id: '',
	},
]

describe('openSenseMap API Routes: /boxes/:deviceId/:sensorId/measurement', () => {
	let deviceId: string
	let sensorId: string
	let jwt: string
	let jwt2: string

	beforeAll(async () => {
		const u = await registerUser(USER.name, USER.email, USER.password, 'en_US')
		const u2 = await registerUser(
			USER2.name,
			USER2.email,
			USER2.password,
			'en_US',
		)
		const d = await createDevice(DEVICE, (u as User).id)
		const s = await getSensors(d.id)
		MEASUREMENTS.forEach((m) => (m.sensor_id = s[0].id))
		await insertMeasurements(MEASUREMENTS)

		deviceId = d.id
		sensorId = s[0].id

		const t = await createToken(u as User)
		jwt = t.token

		const t2 = await createToken(u2 as User)
		jwt2 = t2.token
	})

	describe('DELETE', () => {
		it('should remove measurements by date range (from-date, to-date)', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/${sensorId}?from-date=${new Date('1954-01-01 00:00:00+00')}&to-date=${new Date('1954-12-31 23:59:59+00')}`,
				{ method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } },
			)

			// Act
			const dataFunctionValue = await action({
				request,
				params: {
					deviceId: `${deviceId}`,
					sensorId: `${sensorId}`,
				} as Params<string>,
			} as ActionFunctionArgs)
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(200)
			expect(body).toHaveProperty('message')
			expect(body.message).toBe(`Successfully deleted 1 of sensor ${sensorId}`)
		})

		it('should remove measurements by exact timestamps', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/${sensorId}?timestamps=${MEASUREMENTS[1].createdAt.toISOString()}`,
				{ method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } },
			)

			// Act
			const dataFunctionValue = await action({
				request,
				params: {
					deviceId: `${deviceId}`,
					sensorId: `${sensorId}`,
				} as Params<string>,
			} as ActionFunctionArgs)
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(200)
			expect(body).toHaveProperty('message')
			expect(body.message).toBe(`Successfully deleted 1 of sensor ${sensorId}`)
		})

		it('should remove all measurements when deleteAll is used', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/${sensorId}?deleteAllMeasurements=true`,
				{ method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } },
			)

			// Act
			const dataFunctionValue = await action({
				request,
				params: {
					deviceId: `${deviceId}`,
					sensorId: `${sensorId}`,
				} as Params<string>,
			} as ActionFunctionArgs)
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(200)
			expect(body).toHaveProperty('message')
			expect(body.message).toBe(`Successfully deleted 1 of sensor ${sensorId}`)
		})

		it('should deny to delete sensordata of boxes not owned by the user', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/${sensorId}?deleteAllMeasurements=true`,
				{ method: 'DELETE', headers: { Authorization: `Bearer ${jwt2}` } },
			)

			// Act
			const dataFunctionValue = await action({
				request,
				params: {
					deviceId: `${deviceId}`,
					sensorId: `${sensorId}`,
				} as Params<string>,
			} as ActionFunctionArgs)
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(403)
			expect(body).toHaveProperty('error')
			expect(body.error).toBe(
				'You are not allowed to delete data of the given device',
			)
		})
	})

	afterAll(async () => {
		await deleteUserByEmail(USER.email)
		await deleteUserByEmail(USER2.email)
		await deleteDevice({ id: deviceId })
	})
})
