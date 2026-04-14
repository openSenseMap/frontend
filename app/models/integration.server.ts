import { asc, eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { type Integration, integration } from "~/schema/integration";

export async function getIntegrations() {
  return drizzleClient.query.integration.findMany({
      orderBy: [asc(integration.order)],
  })
}

export async function getIntegrationById({ id }: Pick<Integration, "id">){
  return drizzleClient.query.integration.findFirst({where: eq(integration.id, id)})
}

export async function isValidServiceKey(serviceKey: string | null): Promise<boolean> {
  if (!serviceKey) return false;

  const integrations = await getIntegrations();

  for (const intg of integrations) {
    const expectedKey = process.env[intg.serviceKey];
    if (expectedKey && serviceKey === expectedKey) {
      return true;
    }
  }

  return false;
}

export async function reconcileDeviceIntegrations({
  deviceId,
  validSensorIds,
}: {
  deviceId: string
  validSensorIds: string[]
}) {
  const integrations = await drizzleClient.query.integration.findMany()

  for (const intg of integrations) {
    const serviceKey = process.env[intg.serviceKey]
    if (!serviceKey) {
      console.warn(`Service key '${intg.serviceKey}' not configured`)
      continue
    }

    try {
      const res = await fetch(
        `${intg.serviceUrl}/integrations/${deviceId}/reconcile-sensors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': serviceKey,
          },
          body: JSON.stringify({ validSensorIds }),
        },
      )

      if (!res.ok && res.status !== 404) {
        const text = await res.text()
        console.error(`Failed to reconcile ${intg.slug} integration`, {
          status: res.status,
          body: text,
        })
      }
    } catch (error) {
      console.error(`Error reconciling ${intg.slug} integration`, error)
    }
  }
}