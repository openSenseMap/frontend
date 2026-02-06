import { type LoaderFunctionArgs } from "react-router";
import { getIntegrations } from "~/models/integration.server";

export interface IntegrationMetadata {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  schemaUrl: string;
}

export async function loader({}: LoaderFunctionArgs) {
  try {
    const integrations = await getIntegrations()

    return Response.json(
      integrations.map((intg) => ({
        id: intg.id,
        name: intg.name,
        slug: intg.slug,
        icon: intg.icon,
        description: intg.description,
        schemaUrl: `/api/integrations/schema/${intg.slug}`,
      }))
    );
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return new Response("Internal server error", { status: 500 });
  }
}