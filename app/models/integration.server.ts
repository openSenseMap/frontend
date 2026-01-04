import { eq } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { mqttIntegration, deviceToIntegrations } from '~/schema'

export async function getMqttIntegrationByDeviceId(deviceId: string) {
	const [result] = await drizzleClient
		.select({
			id: mqttIntegration.id,
			enabled: mqttIntegration.enabled,
			url: mqttIntegration.url,
			topic: mqttIntegration.topic,
			messageFormat: mqttIntegration.messageFormat,
			decodeOptions: mqttIntegration.decodeOptions,
			connectionOptions: mqttIntegration.connectionOptions,
		})
		.from(deviceToIntegrations)
		.innerJoin(
			mqttIntegration,
			eq(deviceToIntegrations.mqttIntegrationId, mqttIntegration.id),
		)
		.where(eq(deviceToIntegrations.deviceId, deviceId))
		.limit(1)

	return result
}

export async function getAllActiveMqttIntegrations() {
	return await drizzleClient
		.select({
			deviceId: deviceToIntegrations.deviceId,
			integrationId: mqttIntegration.id,
			url: mqttIntegration.url,
			topic: mqttIntegration.topic,
			messageFormat: mqttIntegration.messageFormat,
			decodeOptions: mqttIntegration.decodeOptions,
			connectionOptions: mqttIntegration.connectionOptions,
		})
		.from(deviceToIntegrations)
		.innerJoin(
			mqttIntegration,
			eq(deviceToIntegrations.mqttIntegrationId, mqttIntegration.id),
		)
		.where(eq(mqttIntegration.enabled, true))
}
