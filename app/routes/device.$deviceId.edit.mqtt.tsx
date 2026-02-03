import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { Save } from "lucide-react";
import React, { useState } from "react";
import { data, redirect , useFetcher, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs  } from "react-router";
import ErrorMessage from "~/components/error-message";
import { CheckboxWidget } from "~/components/rjsf/checkboxWidget";
import { FieldTemplate } from "~/components/rjsf/fieldTemplate";
import { BaseInputTemplate } from "~/components/rjsf/inputTemplate";
import { toast } from "~/components/ui/use-toast";
import { getUserId } from "~/utils/session.server";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/");
  const { deviceId } = params;

  try {
    const headers = {
    "x-service-key": process.env.MQTT_SERVICE_KEY!,
  };
    
     const [schemaRes, integrationRes] = await Promise.all([
    fetch(`${process.env.MQTT_SERVICE_URL}/integrations/schema/mqtt`, { headers }),
    fetch(`${process.env.MQTT_SERVICE_URL}/integrations/${deviceId}`, { headers }),
  ]);

  if (!schemaRes.ok) {
    throw new Response("Failed to load MQTT schema", { status: 500 });
  }

  const schemaData = await schemaRes.json();

  let integration = null;
  if (integrationRes.ok) {
    integration = await integrationRes.json();
  }

  const data = {
    schema: schemaData.schema,
    uiSchema: schemaData.uiSchema,
    integration,
  };

  return data;
}
  catch{
    console.log("err")
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { deviceId } = params;
  
  const formData = await request.formData();
  const mqttConfigStr = formData.get("mqttConfig");
  
  if (!mqttConfigStr) {
    return data({ error: "No MQTT config provided" }, { status: 400 });
  }

  const mqttConfig = JSON.parse(mqttConfigStr.toString());
  
  const serviceUrl = process.env.MQTT_SERVICE_URL;
  const serviceKey = process.env.MQTT_SERVICE_KEY;

  if (!serviceUrl || !serviceKey) {
    throw new Error("MQTT service env vars are not configured");
  }

  if (!mqttConfig.enabled) {
    await fetch(`${serviceUrl}/integrations/${deviceId}`, {
      method: 'DELETE',
      headers: { 'x-service-key': serviceKey }
    });
    return data({ success: true });
  }

  // Create or update integration
  const response = await fetch(`${serviceUrl}/integrations/${deviceId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-service-key': serviceKey
    },
    body: JSON.stringify({
      url: mqttConfig.url,
      topic: mqttConfig.topic,
      messageFormat: mqttConfig.messageFormat,
      decodeOptions: mqttConfig.decodeOptions,
      connectionOptions: mqttConfig.connectionOptions,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    return data({ 
      error: error.error || error.details || 'Failed to save configuration' 
    }, { status: response.status });
  }

  return data({ success: true });
}

export default function EditBoxMQTT() {
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData) {
    throw new Error("Loader data missing");
  }

  const { schema, uiSchema, integration } = loaderData;


  const [formData, setFormData] = React.useState(() => {
    if (!integration) {
      return {
        enabled: false,
        messageFormat: "json",
      };
    }

    return {
      enabled: integration.enabled,
      url: integration.url,
      topic: integration.topic,
      messageFormat: integration.messageFormat,
      decodeOptions: integration.decodeOptions,
      connectionOptions: integration.connectionOptions,
    };
  });
  const fetcher = useFetcher();


  React.useEffect(() => {
    if (fetcher.data?.success) {
      toast({ description: "MQTT configuration saved successfully!" });
    }
  }, [fetcher.data]);

  const handleSubmit = async ({ formData: newFormData }: any) => {
  await fetcher.submit(
    { mqttConfig: JSON.stringify(newFormData) },
    { method: "post" }
  );
};

  return (
      <div className="mx-auto max-w-xl">
      <h1 className="text-4xl mb-4">MQTT</h1>

        <Form
          widgets={{CheckboxWidget}}
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          validator={validator}
          templates={{ FieldTemplate, BaseInputTemplate }}
          onChange={(e: any) => setFormData(e.formData)}
          onSubmit={handleSubmit}
        >
          <button
            type="submit"
            className="mt-4 h-12 w-12 rounded-full border"
          >
            <Save className="mx-auto h-6 w-6" />
          </button>
        </Form>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
