import { type Params, type LoaderFunctionArgs } from 'react-router'
import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { BASE_URL } from 'vitest.setup'
import { registerUser } from '~/lib/user-service.server'
import { createDevice, deleteDevice } from '~/models/device.server'
import {
	deleteMeasurementsForSensor,
	deleteMeasurementsForTime,
	saveMeasurements,
} from '~/models/measurement.server'
import { getSensors } from '~/models/sensor.server'
import { deleteUserByEmail } from '~/models/user.server'
import { loader } from '~/routes/api.boxes.$deviceId.locations'
import { type Sensor, type Device, type User } from '~/schema'

const DEVICE_SENSORS_ID_USER = generateTestUserCredentials()

const DEVICE_SENSOR_ID_BOX = {
	name: `${DEVICE_SENSORS_ID_USER}s Box`,
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

const MEASUREMENTS = [
	{
		value: 1589625,
		createdAt: new Date('1954-06-07 12:00:00+00'),
		sensor_id: '',
		location: {
			lng: 1,
			lat: 2,
			height: 3,
		},
	},
	{
		value: 3.14159,
		createdAt: new Date('1988-03-14 1:59:26+00'),
		sensor_id: '',
		location: {
			lng: 4,
			lat: 5,
		},
	},
	{
		value: 0,
		createdAt: new Date('2000-05-25 11:11:11+00'),
		sensor_id: '',
		location: {
			lng: 6,
			lat: 7,
			height: 8,
		},
	},
]

describe('openSenseMap API Routes: /api/boxes/:deviceId/locations', () => {
	let device: Device
	let deviceId: string = ''
	let sensors: Sensor[]

	beforeAll(async () => {
		const user = await registerUser(
			DEVICE_SENSORS_ID_USER.name,
			DEVICE_SENSORS_ID_USER.email,
			DEVICE_SENSORS_ID_USER.password,
			'en_US',
		)

		device = await createDevice(DEVICE_SENSOR_ID_BOX, (user as User).id)
		deviceId = device.id
		sensors = await getSensors(deviceId)

		MEASUREMENTS.forEach((meas) => (meas.sensor_id = sensors[0].id))
		await saveMeasurements(device, MEASUREMENTS)
	})

	describe('GET', () => {
		it('should return locations of a box in json format', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/locations?from-date=${new Date('1954-06-07 11:00:00+00')}&to-date=${new Date('1988-03-14 1:59:27+00')}`,
				{ method: 'GET' },
			)

			// Act
			const dataFunctionValue = await loader({
				request,
				params: {
					deviceId: `${deviceId}`,
				} as Params<string>,
			} as LoaderFunctionArgs) // Assuming a separate loader for single sensor
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(200)
			expect(response.headers.get('content-type')).toBe(
				'application/json; charset=utf-8',
			)
			expect(body).toHaveLength(2)
			expect(body[0].coordinates).toHaveLength(2)
			expect(body[1].coordinates).toHaveLength(2)
			expect(body[0].coordinates[0]).toBe(4)
			expect(body[0].coordinates[1]).toBe(5)
			expect(body[1].coordinates[0]).toBe(1)
			expect(body[1].coordinates[1]).toBe(2)
			expect(body[0].type).toBe('Point')
			expect(body[1].type).toBe('Point')
			expect(body[0].timestamp).toBe('1988-03-14T01:59:26.000Z')
			expect(body[1].timestamp).toBe('1954-06-07T12:00:00.000Z')
		})

		it('should return locations of a box in geojson format', async () => {
			// Arrange
			const request = new Request(
				`${BASE_URL}/api/boxes/${deviceId}/locations?from-date=${new Date('1954-06-07 11:00:00+00')}&to-date=${new Date('1988-03-14 1:59:27+00')}&format=geojson`,
				{ method: 'GET' },
			)

			// Act
			const dataFunctionValue = await loader({
				request,
				params: {
					deviceId: `${deviceId}`,
				} as Params<string>,
			} as LoaderFunctionArgs) // Assuming a separate loader for single sensor
			const response = dataFunctionValue as Response
			const body = await response?.json()

			// Assert
			expect(response.status).toBe(200)
			expect(response.headers.get('content-type')).toBe(
				'application/geo+json; charset=utf-8',
			)
			expect(body.type).toBe('Feature')
			expect(body.geometry.type).toBe('LineString')
			expect(body.geometry.coordinates).toHaveLength(2)
			expect(body.geometry.coordinates[0]).toHaveLength(2)
			expect(body.geometry.coordinates[1]).toHaveLength(2)
			expect(body.geometry.coordinates[0][0]).toBe(4)
			expect(body.geometry.coordinates[0][1]).toBe(5)
			expect(body.geometry.coordinates[1][0]).toBe(1)
			expect(body.geometry.coordinates[1][1]).toBe(2)
			expect(body.properties.timestamps).toHaveLength(2)
			expect(body.properties.timestamps[0]).toBe('1988-03-14T01:59:26.000Z')
			expect(body.properties.timestamps[1]).toBe('1954-06-07T12:00:00.000Z')
		})
	})

	afterAll(async () => {
		//delete measurements
		if (sensors?.length > 0) {
			await deleteMeasurementsForSensor(sensors[0].id)
			MEASUREMENTS.forEach(
				async (measurement) =>
					await deleteMeasurementsForTime(measurement.createdAt),
			)
		}
		// delete the valid test user
		await deleteUserByEmail(DEVICE_SENSORS_ID_USER.email)
		// delete the box
		await deleteDevice({ id: deviceId })
	})
})
