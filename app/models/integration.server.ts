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

export async function deleteDeviceIntegrations(deviceId: string) {
  const integrations = await drizzleClient.query.integration.findMany()

  const results: Array<{
    slug: string
    ok: boolean
    status?: number
    error?: string
  }> = []

  for (const intg of integrations) {
    const serviceKey = process.env[intg.serviceKey]

    if (!serviceKey) {
      results.push({
        slug: intg.slug,
        ok: false,
        error: `Service key '${intg.serviceKey}' not configured`,
      })
      continue
    }

    try {
      const response = await fetch(`${intg.serviceUrl}/integrations/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'x-service-key': serviceKey,
        },
      })

      // 404 is fine: no integration existed for this device
      if (response.ok || response.status === 404) {
        results.push({
          slug: intg.slug,
          ok: true,
          status: response.status,
        })
      } else {
        const text = await response.text()
        results.push({
          slug: intg.slug,
          ok: false,
          status: response.status,
          error: text,
        })
      }
    } catch (error) {
      results.push({
        slug: intg.slug,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}