import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CheckboxWidget } from "~/components/rjsf/checkboxWidget";
import { FieldTemplate } from "~/components/rjsf/fieldTemplate";
import { BaseInputTemplate } from "~/components/rjsf/inputTemplate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

interface Integration {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  order: number;
}

interface AdvancedStepProps {
  integrations: Integration[];
}

export function AdvancedStep({ integrations }: AdvancedStepProps) {
  const { watch, setValue, resetField } = useFormContext();
  const [schemas, setSchemas] = useState<Record<string, { schema: any; uiSchema: any }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});


  const loadSchema = async (slug: string) => {
    if (schemas[slug]) return;

    setLoading((prev) => ({ ...prev, [slug]: true }));

    try {
      const res = await fetch(`/api/integrations/schema/${slug}`);
      if (!res.ok) throw new Error(`Failed to fetch ${slug} schema`);

        const data = await res.json();
        setSchemas((prev) => ({ ...prev, [slug]: data }));
      } catch (err) {
        console.error(`Failed to load ${slug} schema`, err);
      } finally {
        setLoading((prev) => ({ ...prev, [slug]: false }));
      }
  }

  const handleToggle = (slug: string, checked: boolean) => {
    setValue(`${slug}Enabled`, checked);

    if (checked) {
      void loadSchema(slug);
    } else {
      resetField(`${slug}Config`);
    }
  };

  return (
    <>
      {integrations.map((intg) => {
        const enabled = watch(`${intg.slug}Enabled`) ?? false;
        const config = watch(`${intg.slug}Config`) ?? {};
        const isLoading = loading[intg.slug] ?? false;
        const schema = schemas[intg.slug];

        return (
          <Card key={intg.id} className="w-full mb-6">
            <CardHeader>
              <CardTitle>{intg.name} Configuration</CardTitle>
              {intg.description && (
                <CardDescription>{intg.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${intg.slug}Enabled`} className="text-base font-semibold">
                  Enable {intg.name}
                </Label>
                <Switch
                  id={`${intg.slug}Enabled`}
                  checked={enabled}
                  onCheckedChange={(checked) => handleToggle(intg.slug, checked)}
                />
              </div>

              {enabled && (
                <>
                  {isLoading && (
                    <p className="text-sm text-muted-foreground">
                      Loading {intg.name} configuration…
                    </p>
                  )}

                  {schema && (
                    <Form
                      widgets={{ CheckboxWidget }}
                      templates={{ FieldTemplate, BaseInputTemplate }}
                      schema={schema.schema}
                      uiSchema={schema.uiSchema}
                      validator={validator}
                      formData={config}
                      onChange={(e) => {
                        setValue(`${intg.slug}Config`, e.formData, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      onSubmit={() => {}}
                    >
                      <></>
                    </Form>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}