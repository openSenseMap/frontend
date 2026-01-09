import { type LoaderFunctionArgs } from "react-router"
import { getMqttIntegrationByDeviceId } from "~/models/integration.server"
import { StandardResponse } from "~/utils/response-utils"

export async function loader({ params, request }: LoaderFunctionArgs) {
  try {
    const deviceId = params.deviceId

    if (!deviceId) {
      return StandardResponse.badRequest("Missing deviceId")
    }

    const key = request.headers.get("x-service-key")

    if (key != process.env.MQTT_SERVICE_KEY){
        return StandardResponse.unauthorized("Key invalid, access denied.")
    }

    const integration = await getMqttIntegrationByDeviceId(deviceId)

    if (!integration) {
      return StandardResponse.notFound("MQTT integration not found")
    }

    return Response.json({
      deviceId: integration.deviceId,
      integrationId: integration.integrationId,
      enabled: integration.enabled,
      url: integration.url,
      topic: integration.topic,
      messageFormat: integration.messageFormat,
      decodeOptions: integration.decodeOptions,
      connectionOptions: integration.connectionOptions,
    })
  } catch (err) {
    console.error("Error fetching MQTT integration:", err)
    return StandardResponse.internalServerError()
  }
}
