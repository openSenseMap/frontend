import { pgEnum } from 'drizzle-orm/pg-core'
import { z } from 'zod'

// Enum for device exposure types
export const DeviceExposureEnum = pgEnum('exposure', [
	'indoor',
	'outdoor',
	'mobile',
	'unknown',
])

// Zod schema for validating device exposure types
export const DeviceExposureZodEnum = z.enum(DeviceExposureEnum.enumValues)

// Type inferred from the Zod schema for device exposure types
export type DeviceExposureType = z.infer<typeof DeviceExposureZodEnum>

// Enum for device status types
export const DeviceStatusEnum = pgEnum('status', ['active', 'inactive', 'old'])

// Zod schema for validating device status types
export const DeviceStatusZodEnum = z.enum(DeviceStatusEnum.enumValues)

// Type inferred from the Zod schema for device status types
export type DeviceStatusType = z.infer<typeof DeviceStatusZodEnum>

// Enum for device model types
export const DeviceModelEnum = pgEnum('model', [
	'homeV2Lora',
	'homeV2Ethernet',
	'homeV2Wifi',
	'homeEthernet',
	'homeWifi',
	'homeEthernetFeinstaub',
	'homeWifiFeinstaub',
	'luftdaten_sds011',
	'luftdaten_sds011_dht11',
	'luftdaten_sds011_dht22',
	'luftdaten_sds011_bmp180',
	'luftdaten_sds011_bme280',
	'hackair_home_v2',
	'senseBox:Edu',
	'luftdaten.info',
	'custom',
])
