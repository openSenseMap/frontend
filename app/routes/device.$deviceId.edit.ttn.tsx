import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { Save } from "lucide-react";
import React from "react";
import { data, redirect, useFetcher, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
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
      "x-service-key": process.env.TTN_SERVICE_KEY!,
    };
    
    const [schemaRes, integrationRes] = await Promise.all([
      fetch(`${process.env.TTN_SERVICE_URL}/integrations/schema/ttn`, { headers }),
      fetch(`${process.env.TTN_SERVICE_URL}/integrations/${deviceId}`, { headers }),
    ]);

    if (!schemaRes.ok) {
      throw new Response("Failed to load TTN schema", { status: 500 });
    }

    const schemaData = await schemaRes.json();

    let integration = null;
    if (integrationRes.ok) {
      integration = await integrationRes.json();
    }

    return {
      schema: schemaData.schema,
      uiSchema: schemaData.uiSchema,
      integration,
    };
  } catch (error) {
    console.error("Error loading TTN integration:", error);
    throw new Response("Failed to load TTN integration", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { deviceId } = params;
  
  const formData = await request.formData();
  const ttnConfigStr = formData.get("ttnConfig");
  
  if (!ttnConfigStr) {
    return data({ error: "No TTN config provided" }, { status: 400 });
  }

  const ttnConfig = JSON.parse(ttnConfigStr.toString());
  
  const serviceUrl = process.env.TTN_SERVICE_URL;
  const serviceKey = process.env.TTN_SERVICE_KEY;

  if (!serviceUrl || !serviceKey) {
    throw new Error("TTN service env vars are not configured");
  }

  // Delete integration if disabled
  if (!ttnConfig.enabled) {
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
      devId: ttnConfig.devId,
      appId: ttnConfig.appId,
      profile: ttnConfig.profile,
      port: ttnConfig.port,
      decodeOptions: ttnConfig.decodeOptions,
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

export default function EditBoxTTN() {
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData) {
    throw new Error("Loader data missing");
  }

  const { schema, uiSchema, integration } = loaderData;

  const [formData, setFormData] = React.useState(() => {
    if (!integration) {
      return {
        enabled: false,
        profile: "json",
        decodeOptions: [{}],
      };
    }

    return {
      enabled: integration.enabled,
      devId: integration.devId,
      appId: integration.appId,
      profile: integration.profile,
      port: integration.port,
      decodeOptions: integration.decodeOptions,
    };
  });

  const fetcher = useFetcher();

  React.useEffect(() => {
    if (fetcher.data?.success) {
      toast({ description: "TTN configuration saved successfully!" });
    }
  }, [fetcher.data]);

  const handleSubmit = async ({ formData: newFormData }: any) => {
    await fetcher.submit(
      { ttnConfig: JSON.stringify(newFormData) },
      { method: "post" }
    );
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-4xl mb-4">TheThingsNetwork - TTN</h1>

      <div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
        <p>
          openSenseMap offers an integration with{" "}
          <a
            href="https://www.thethingsnetwork.org/"
            className="cursor-pointer text-[#4eaf47]"
          >
            TheThingsNetwork.{" "}
          </a>
          Documentation for the parameters is provided{" "}
          <a
            href="https://github.com/sensebox/ttn-osem-integration"
            className="cursor-pointer text-[#4eaf47]"
          >
            on GitHub
          </a>
        </p>
      </div>

      <Form
        widgets={{ CheckboxWidget }}
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        templates={{ FieldTemplate, BaseInputTemplate  }}
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

      {fetcher.data?.error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-4 text-red-800">
          {fetcher.data.error}
        </div>
      )}
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