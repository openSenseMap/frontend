import { env } from "./env"
import { setMqttIntegrationEnabled } from "~/models/integration.server"

interface MqttClientResponse {
  success: boolean
  deviceId: string
}

interface MqttStatusResponse {
  deviceId: string
  connected: boolean
}

interface MqttHealthResponse {
  status: string
  connections: number
  timestamp: string
}

class MqttClient {
    private baseUrl = env.MQTT_SERVICE_URL
    private serviceKey = env.MQTT_SERVICE_KEY

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': this.serviceKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Unknown error' 
      }))
      throw new Error(
        `MQTT Service error: ${response.status} - ${error.error || error.message || 'Unknown error'}`
      )
    }

    return response.json()
  }

  /**
   * Connect a device to its MQTT broker
   */
  async connectBox(params: { box_id: string }): Promise<MqttClientResponse> {
    await setMqttIntegrationEnabled(params.box_id, true)
    return this.request<MqttClientResponse>(
      `/devices/${params.box_id}/connect`,
      { method: 'POST' }
    )
  }

  /**
   * Disconnect a device from its MQTT broker
   */
  async disconnectBox(params: { box_id: string }): Promise<MqttClientResponse> {
    await setMqttIntegrationEnabled(params.box_id, false)
    return this.request<MqttClientResponse>(
      `/devices/${params.box_id}/disconnect`,
      { method: 'POST' }
    )
  }

  /**
   * Reconnect a device (disconnect then connect with fresh config)
   */
  async reconnectBox(params: { box_id: string }): Promise<MqttClientResponse> {
    return this.request<MqttClientResponse>(
      `/devices/${params.box_id}/reconnect`,
      { method: 'POST' }
    )
  }

  /**
   * Get connection status for a device
   */
  async getStatus(deviceId: string): Promise<MqttStatusResponse> {
    return this.request<MqttStatusResponse>(
      `/devices/${deviceId}/status`,
      { method: 'GET' }
    )
  }

  /**
   * Get health status of the MQTT service
   */
  async getHealth(): Promise<MqttHealthResponse> {
    return this.request<MqttHealthResponse>(
      '/health',
      { method: 'GET' }
    )
  }
}

export const mqttClient = new MqttClient()