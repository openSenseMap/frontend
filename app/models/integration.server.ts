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
