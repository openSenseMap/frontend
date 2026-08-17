import { z } from 'zod'

export const DEVICE_EXPOSURE_VALUES = [
	'indoor',
	'outdoor',
	'mobile',
	'unknown',
] as const

export const DEVICE_STATUS_VALUES = ['active', 'inactive', 'old'] as const

export const LUFTDATEN_MODEL_VALUES = [
	'luftdaten_sds011',
	'luftdaten_sds011_dht11',
	'luftdaten_sds011_dht22',
	'luftdaten_sds011_bmp180',
	'luftdaten_sds011_bme280',
	'luftdaten_pms1003',
	'luftdaten_pms1003_bme280',
	'luftdaten_pms3003',
	'luftdaten_pms3003_bme280',
	'luftdaten_pms5003',
	'luftdaten_pms5003_bme280',
	'luftdaten_pms7003',
	'luftdaten_pms7003_bme280',
	'luftdaten_sps30_bme280',
	'luftdaten_sps30_sht3x',
] as const

export const DEVICE_MODEL_VALUES = [
	'homeV2Lora',
	'homeV2Ethernet',
	'homeV2Wifi',
	'homeEthernet',
	'homeWifi',
	'homeEthernetFeinstaub',
	'homeWifiFeinstaub',
	...LUFTDATEN_MODEL_VALUES,
	'hackair_home_v2',
	'senseBox:Edu',
	'custom',
] as const

export const DeviceExposureZodEnum = z.enum(DEVICE_EXPOSURE_VALUES)
export const DeviceStatusZodEnum = z.enum(DEVICE_STATUS_VALUES)
export const DeviceModelZodEnum = z.enum(DEVICE_MODEL_VALUES)

export type DeviceExposureType = z.infer<typeof DeviceExposureZodEnum>
export type DeviceStatusType = z.infer<typeof DeviceStatusZodEnum>
export type DeviceModelType = z.infer<typeof DeviceModelZodEnum>

export function parseDeviceExposure(value: unknown): DeviceExposureType | null {
	const normalized = typeof value === 'string' ? value.toLowerCase() : value

	const result = DeviceExposureZodEnum.safeParse(normalized)

	return result.success ? result.data : null
}

export function getDeviceExposure(value: unknown): DeviceExposureType {
	return parseDeviceExposure(value) ?? 'unknown'
}
