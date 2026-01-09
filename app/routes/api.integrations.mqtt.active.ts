import { type LoaderFunction } from 'react-router'
import { getAllActiveMqttIntegrations } from '~/models/integration.server'
import { StandardResponse } from '~/utils/response-utils'

export const loader: LoaderFunction = async ({ request }) => {
	try {
		const key = request.headers.get("x-service-key")

		if (key != process.env.MQTT_SERVICE_KEY){
			return StandardResponse.unauthorized("Key invalid, access denied.")
		}

		const integrations = await getAllActiveMqttIntegrations()

		const response = integrations.map((integration) => ({
			deviceId: integration.deviceId,
			integrationId: integration.integrationId,
			enabled: integration.enabled,
			url: integration.url,
			topic: integration.topic,
			messageFormat: integration.messageFormat,
			decodeOptions: integration.decodeOptions,
			connectionOptions: integration.connectionOptions,
		}))

		return Response.json(response)
	} catch (err) {
		console.error('Error fetching active MQTT integrations:', err)
		return StandardResponse.internalServerError()
	}
}
