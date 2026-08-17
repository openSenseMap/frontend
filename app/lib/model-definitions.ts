import { sensorDefinitions } from './sensor-definitions'

type SensorKey = keyof typeof sensorDefinitions

type SensorWithDefinitionId = (typeof sensorDefinitions)[SensorKey] & {
	id: SensorKey
}

const senseBoxHomeV2: readonly SensorKey[] = [
	'hdc1080_temperature',
	'hdc1080_humidity',
	'bmp280_pressure',
	'tsl45315_lightintensity',
	'veml6070_uvintensity',
	'sds011_pm10',
	'sds011_pm25',
	'bme680_humidity',
	'bme680_temperature',
	'bme680_pressure',
	'bme680_voc',
	'smt50_soilmoisture',
	'smt50_soiltemperature',
	'soundlevelmeter',
	'windspeed',
	'scd30_co2',
	'dps310_pressure',
	'sps30_pm1',
	'sps30_pm4',
	'sps30_pm10',
	'sps30_pm25',
] as const

const luftdatenSds011 = ['sds011_pm10', 'sds011_pm25'] as const
const luftdatenBme280 = [
	'bme280_temperature',
	'bme280_humidity',
	'bme280_pressure_pa',
] as const

const luftdatenPms1003 = [
	'pms1003_pm01',
	'pms1003_pm25',
	'pms1003_pm10',
] as const
const luftdatenPms3003 = [
	'pms3003_pm01',
	'pms3003_pm25',
	'pms3003_pm10',
] as const
const luftdatenPms5003 = [
	'pms5003_pm01',
	'pms5003_pm25',
	'pms5003_pm10',
] as const
const luftdatenPms7003 = [
	'pms7003_pm01',
	'pms7003_pm25',
	'pms7003_pm10',
] as const
const luftdatenSps30 = ['sps30_pm1', 'sps30_pm25', 'sps30_pm10'] as const

export const modelDefinitions = {
	senseBoxHomeV2,
	homeV2Lora: senseBoxHomeV2,
	homeV2Ethernet: senseBoxHomeV2,
	homeV2EthernetFeinstaub: senseBoxHomeV2,
	homeV2Wifi: senseBoxHomeV2,
	homeV2WifiFeinstaub: senseBoxHomeV2,

	'senseBox:Edu': [
		'hdc1080_temperature',
		'hdc1080_humidity',
		'bmp280_pressure',
		'tsl45315_lightintensity',
		'veml6070_uvintensity',
		'sds011_pm10',
		'sds011_pm25',
		'bme680_humidity',
		'bme680_temperature',
		'bme680_pressure',
		'bme680_voc',
		'smt50_soilmoisture',
		'smt50_soiltemperature',
		'soundlevelmeter',
		'windspeed',
		'scd30_co2',
		'dps310_pressure',
		'sps30_pm1',
		'sps30_pm4',
		'sps30_pm10',
		'sps30_pm25',
	] as const satisfies readonly SensorKey[],

	luftdaten_sds011: luftdatenSds011,
	luftdaten_sds011_dht11: [
		...luftdatenSds011,
		'dht11_temperature',
		'dht11_humidity',
	],
	luftdaten_sds011_dht22: [
		...luftdatenSds011,
		'dht22_temperature',
		'dht22_humidity',
	],
	luftdaten_sds011_bmp180: [
		...luftdatenSds011,
		'bmp180_temperature',
		'bmp180_pressure_pa',
	],
	luftdaten_sds011_bme280: [...luftdatenSds011, ...luftdatenBme280],
	luftdaten_pms1003: luftdatenPms1003,
	luftdaten_pms1003_bme280: [...luftdatenPms1003, ...luftdatenBme280],
	luftdaten_pms3003: luftdatenPms3003,
	luftdaten_pms3003_bme280: [...luftdatenPms3003, ...luftdatenBme280],
	luftdaten_pms5003: luftdatenPms5003,
	luftdaten_pms5003_bme280: [...luftdatenPms5003, ...luftdatenBme280],
	luftdaten_pms7003: luftdatenPms7003,
	luftdaten_pms7003_bme280: [...luftdatenPms7003, ...luftdatenBme280],
	luftdaten_sps30_bme280: [...luftdatenSps30, ...luftdatenBme280],
	luftdaten_sps30_sht3x: [
		'sht3x_temperature',
		'sht3x_humidity',
		...luftdatenSps30,
	],
	hackair_home_v2: luftdatenSds011,

	homeEthernet: [
		'hdc1008_temperature',
		'hdc1008_humidity',
		'bmp280_pressure',
		'tsl45315_lightintensity',
		'veml6070_uvintensity',
	] as const satisfies readonly SensorKey[],

	homeWifi: [
		'hdc1008_temperature',
		'hdc1008_humidity',
		'bmp280_pressure',
		'tsl45315_lightintensity',
		'veml6070_uvintensity',
	] as const satisfies readonly SensorKey[],

	homeEthernetFeinstaub: [
		'hdc1008_temperature',
		'hdc1008_humidity',
		'bmp280_pressure',
		'tsl45315_lightintensity',
		'veml6070_uvintensity',
		'sds011_pm10',
		'sds011_pm25',
	] as const satisfies readonly SensorKey[],

	homeWifiFeinstaub: [
		'hdc1008_temperature',
		'hdc1008_humidity',
		'bmp280_pressure',
		'tsl45315_lightintensity',
		'veml6070_uvintensity',
		'sds011_pm10',
		'sds011_pm25',
	] as const satisfies readonly SensorKey[],
} as const

export type ModelDefinitionKey = keyof typeof modelDefinitions

export const getSensorsForModel = (
	model: ModelDefinitionKey,
	sensorTemplates?: readonly string[],
): SensorWithDefinitionId[] => {
	const keys = modelDefinitions[model]
	if (!keys) return []

	const sensors = keys.map((key) => ({
		id: key,
		...sensorDefinitions[key],
	}))

	if (!sensorTemplates?.length) return sensors

	const normalizedTemplates = new Set(
		sensorTemplates.map((template) => template.toLowerCase()),
	)
	return sensors.filter(
		(sensor) =>
			normalizedTemplates.has(sensor.id.toLowerCase()) ||
			normalizedTemplates.has(sensor.sensorType.toLowerCase()),
	)
}

export function getUnknownSensorTemplates(
	model: ModelDefinitionKey,
	sensorTemplates: readonly string[],
): string[] {
	const modelSensors = getSensorsForModel(model)
	return sensorTemplates.filter((template) => {
		const normalized = template.toLowerCase()
		return !modelSensors.some(
			(sensor) =>
				sensor.id.toLowerCase() === normalized ||
				sensor.sensorType.toLowerCase() === normalized,
		)
	})
}

export function getSensorTemplateValidationError(
	model: string | undefined,
	sensorTemplates: readonly string[] | undefined,
): string | undefined {
	if (!model || model.toLowerCase() === 'custom') return undefined
	if (!(model in modelDefinitions)) return `Unknown model: ${model}`
	if (!sensorTemplates?.length) return undefined

	const definitionModel = model as ModelDefinitionKey
	const unknownTemplates = getUnknownSensorTemplates(
		definitionModel,
		sensorTemplates,
	)
	if (unknownTemplates.length > 0) {
		return `Unknown sensor templates for model ${model}: ${unknownTemplates.join(', ')}`
	}

	return undefined
}
