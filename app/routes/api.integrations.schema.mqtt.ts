import  { type LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const serviceUrl = process.env.MQTT_SERVICE_URL;
  const serviceKey = process.env.MQTT_SERVICE_KEY;

  if (!serviceUrl || !serviceKey) {
    return new Response("MQTT service not configured", { status: 500 });
  }

  const res = await fetch(`${serviceUrl}/integrations/schema/mqtt`, {
    headers: {
      "x-service-key": serviceKey,
    },
  });

  if (!res.ok) {
    return new Response("Failed to fetch MQTT schema", {
      status: res.status,
    });
  }

  const schema = await res.json();

  return Response.json(schema);
}
