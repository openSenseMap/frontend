import { type LoaderFunction } from 'react-router'
import { getAllActiveMqttIntegrations } from '~/models/integration.server'
import { StandardResponse } from '~/utils/response-utils'

export const loader: LoaderFunction = async ({ request }) => {
	try {
		// TODO: Add service authentication

		const integrations = await getAllActiveMqttIntegrations()

		const response = integrations.map((integration) => ({
			deviceId: integration.deviceId,
			integrationId: integration.integrationId,
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
