import { type LoaderFunctionArgs } from "react-router";
import { buildApiSpecFromRoutes } from "~/lib/api-spec-builder";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const spec = await buildApiSpecFromRoutes();  
    // Log the spec to debug
    console.log('Generated OpenAPI spec:', JSON.stringify(spec, null, 2));
    
    return new Response(JSON.stringify(spec, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error('Error building API spec:', error);
    return new Response(JSON.stringify({ error: 'Failed to build API spec' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};