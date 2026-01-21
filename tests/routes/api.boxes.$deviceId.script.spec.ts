import { type Params, type LoaderFunctionArgs } from 'react-router'
import { BASE_URL } from 'vitest.setup'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import { deleteUserByEmail } from '~/models/user.server'
import { loader } from '~/routes/api.boxes.$deviceId.script'
import { type User } from '~/schema'

const DEVICE_SENSORS_USER = {
	name: 'meTestSensors',
	email: 'test@box.sensors',
	password: 'highlySecurePasswordForTesting',
}

const DEVICE_SENSOR_BOX = {
	name: `${DEVICE_SENSORS_USER}s Box`,
	exposure: 'outdoor',
	expiresAt: null,
	tags: [],
	latitude: 0,
	longitude: 0,
	model: 'luftdaten.info',
	mqttEnabled: false,
	ttnEnabled: false,
	sensors: [
		{
			title: 'Temp',
			unit: '°C',
			sensorType: 'dummy',
		},
		{
			title: 'CO2',
			unit: 'mol/L',
			sensorType: 'dummy',
		},
		{
			title: 'Air Pressure',
			unit: 'kPa',
			sensorType: 'dummy',
		},
	],
}

const { generateSketchMock } = vi.hoisted(() => ({
	generateSketchMock: vi.fn().mockResolvedValue(new Response('ok')),
}))
vi.mock('@sensebox/sketch-templater', () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			generateSketch: generateSketchMock,
		})),
	}
})

describe('openSenseMap API Routes: /boxes/:deviceId/script', () => {
	let deviceId = ''

	beforeAll(async () => {
		const user = await registerUser(
			DEVICE_SENSORS_USER.name,
			DEVICE_SENSORS_USER.email,
			DEVICE_SENSORS_USER.password,
			'en_US',
		)

		const device = await createDevice(DEVICE_SENSOR_BOX, (user as User).id)
		deviceId = device.id
	})

	afterAll(async () => {
		await deleteUserByEmail(DEVICE_SENSORS_USER.email)
		await deleteDevice({ id: deviceId })
	})

	it('should generate a sketch for a valid deviceId', async () => {
		const request = new Request(
			`${BASE_URL}/boxes/${deviceId}/script?enable_debug=true&display_enabled=false`,
			{ method: 'GET' },
		)

		const dataFunctionValue = await loader({
			request,
			params: { deviceId: `${deviceId}` } as Params<string>,
		} as LoaderFunctionArgs)

		const response = dataFunctionValue as Response

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('ok')
		expect(generateSketchMock).toHaveBeenCalled()
	})

	it('should return 400 if deviceId is missing', async () => {
		const request = new Request(`${BASE_URL}/boxes//script?enable_debug=true`, {
			method: 'GET',
		})

		const dataFunctionValue = await loader({
			request,
			params: {} as Params<string>,
		} as LoaderFunctionArgs)

		const response = dataFunctionValue as Response
		expect(response.status).toBe(400)
	})
})
