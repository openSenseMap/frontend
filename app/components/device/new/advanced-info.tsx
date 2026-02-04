import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CheckboxWidget } from "~/components/rjsf/checkboxWidget";
import { FieldTemplate } from "~/components/rjsf/fieldTemplate";
import { BaseInputTemplate } from "~/components/rjsf/inputTemplate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

export function AdvancedStep() {
  const { watch, setValue, resetField } = useFormContext();

  const mqttEnabled = watch("mqttEnabled") ?? false;
  const ttnEnabled = watch("ttnEnabled") ?? false;
  const mqttConfig = watch("mqttConfig") ?? {};

  const [schema, setSchema] = useState<any>(null);
  const [uiSchema, setUiSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // ----------------------------------
  // Load MQTT schema on demand
  // ----------------------------------
  useEffect(() => {
    if (!mqttEnabled || schema) return;

    const loadSchema = async () => {
      setLoading(true);
      setSchemaError(null);

      try {
        const res = await fetch("/api/integrations/schema/mqtt");

        if (!res.ok) {
          throw new Error("Failed to fetch MQTT schema");
        }

        const data = await res.json();
        setSchema(data.schema);
        setUiSchema(data.uiSchema);
      } catch (err) {
        console.error("Failed to load MQTT schema", err);
        setSchemaError("Failed to load MQTT configuration schema.");
      } finally {
        setLoading(false);
      }
    };

    void loadSchema();
  }, [mqttEnabled, schema]);

  // ----------------------------------
  // Toggle handlers
  // ----------------------------------
  const handleMqttToggle = (checked: boolean) => {
    setValue("mqttEnabled", checked);

    if (!checked) {
      resetField("mqttConfig");
    }
  };

  const handleTtnToggle = (checked: boolean) => {
    setValue("ttnEnabled", checked);
  };

  return (
    <>
      {/* ============================= */}
      {/* MQTT Configuration */}
      {/* ============================= */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>MQTT Configuration</CardTitle>
          <CardDescription>
            Configure your MQTT settings for data streaming
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="mqttEnabled" className="text-base font-semibold">
              Enable MQTT
            </Label>
            <Switch
              id="mqttEnabled"
              checked={mqttEnabled}
              onCheckedChange={handleMqttToggle}
            />
          </div>

          {mqttEnabled && (
            <>
              {loading && (
                <p className="text-sm text-muted-foreground">
                  Loading MQTT configuration…
                </p>
              )}

              {schemaError && (
                <p className="text-sm text-red-600">{schemaError}</p>
              )}

              {schema && (
                <Form
                  widgets={{CheckboxWidget}}
                  templates={{ FieldTemplate, BaseInputTemplate }}
                  schema={schema}
                  uiSchema={uiSchema}
                  validator={validator}
                  formData={mqttConfig}
                  onChange={(e) => {
                    setValue("mqttConfig", e.formData, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  onSubmit={() => {}}
                >
                  {/* Prevent native submit */}
                  <></>
                </Form>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================= */}
      {/* TTN Configuration */}
      {/* ============================= */}
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle>TTN Configuration</CardTitle>
          <CardDescription>
            Configure your TTN (The Things Network) settings
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="ttnEnabled" className="text-base font-semibold">
              Enable TTN
            </Label>
            <Switch
              disabled
              id="ttnEnabled"
              checked={ttnEnabled}
              onCheckedChange={handleTtnToggle}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
