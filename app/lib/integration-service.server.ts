import { getIntegrations } from '~/models/integration.server';

interface IntegrationResult {
  integration: string;
  status: 'success' | 'failed';
  error?: string;
}

/**
 * Creates integrations for a device based on the provided config.
 * Iterates over all registered integrations and calls their respective
 * microservices if enabled in the config.
 */
export async function createDeviceIntegrations(
  deviceId: string,
  advanced: Record<string, any>
): Promise<IntegrationResult[]> {
  const availableIntegrations = await getIntegrations();
  const results: IntegrationResult[] = [];

  for (const intg of availableIntegrations) {
    const enabledKey = `${intg.slug}Enabled`;
    const configKey = `${intg.slug}Config`;

    // Skip if not enabled or no config provided
    if (!advanced?.[enabledKey] || !advanced?.[configKey]) {
      continue;
    }

    try {
      const serviceKey = process.env[intg.serviceKey];

      if (!serviceKey) {
        throw new Error(
          `Service key env var '${intg.serviceKey}' not configured`
        );
      }

      const response = await fetch(
        `${intg.serviceUrl}/integrations/${deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': serviceKey,
          },
          body: JSON.stringify(advanced[configKey]),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed: ${response.status} - ${errText}`);
      }

      results.push({
        integration: intg.name,
        status: 'success',
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      

      results.push({
        integration: intg.name,
        status: 'failed',
        error: message,
      });
    }
  }

  return results;
}

/**
 * Deletes integrations for a device across all registered microservices.
 */
export async function deleteDeviceIntegrations(
  deviceId: string
): Promise<IntegrationResult[]> {
  const availableIntegrations = await getIntegrations();
  const results: IntegrationResult[] = [];

  for (const intg of availableIntegrations) {
    try {
      const serviceKey = process.env[intg.serviceKey];

      if (!serviceKey) {
        throw new Error(
          `Service key env var '${intg.serviceKey}' not configured`
        );
      }

      const response = await fetch(
        `${intg.serviceUrl}/integrations/${deviceId}`,
        {
          method: 'DELETE',
          headers: {
            'x-service-key': serviceKey,
          },
        }
      );

      // 404 is fine - integration may not exist for this device
      if (!response.ok && response.status !== 404) {
        const errText = await response.text();
        throw new Error(`Failed: ${response.status} - ${errText}`);
      }

      results.push({
        integration: intg.name,
        status: 'success',
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      results.push({
        integration: intg.name,
        status: 'failed',
        error: message,
      });
    }
  }

  return results;
}

/**
 * Updates integrations for a device.
 * Same as createDeviceIntegrations since the PUT endpoint handles upserts.
 */
export const updateDeviceIntegrations = createDeviceIntegrations;