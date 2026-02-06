import { type OpenAPIV3 } from "openapi-types";
import { integrationOpenapiSpecification } from "./integration.openapi";
import { openapiSpecification } from "./openapi";

type OpenAPIDocumentWithTagGroups = OpenAPIV3.Document & {
  "x-tagGroups"?: Array<{
    name: string;
    tags: string[];
  }>;
};

function prefixOperationTags(
  paths: OpenAPIV3.PathsObject,
  prefix: string,
): OpenAPIV3.PathsObject {
  const result: OpenAPIV3.PathsObject = {};

  for (const [path, methods] of Object.entries(paths)) {
    result[path] = {};

    for (const [method, operation] of Object.entries(methods ?? {})) {
      if (!operation || typeof operation !== "object") continue;

      const op = operation as OpenAPIV3.OperationObject;

      result[path]![method as OpenAPIV3.HttpMethods] = {
        ...op,
        tags: op.tags?.map((t) => `${prefix} · ${t}`),
      };
    }
  }

  return result;
}

export const combinedOpenapiSpecification =
  (): OpenAPIDocumentWithTagGroups => {
    const main = openapiSpecification() as OpenAPIV3.Document;
    const integration =
      integrationOpenapiSpecification() as OpenAPIV3.Document;

    return {
      ...main,

      info: {
        ...main.info,
        title: "OpenSenseMap API",
        description: `
# OpenSenseMap API Documentation

Use the links below or the sidebar to navigate.

- Public API
- Integration API
        `,
      },

      tags: [
        ...(main.tags ?? []).map((t) => ({
          ...t,
          name: `Public · ${t.name}`,
        })),
        ...(integration.tags ?? []).map((t) => ({
          ...t,
          name: `Integration · ${t.name}`,
        })),
      ],

      paths: {
        ...prefixOperationTags(main.paths ?? {}, "Public"),
        ...prefixOperationTags(integration.paths ?? {}, "Integration"),
      },

      components: {
        schemas: {
          ...main.components?.schemas,
          ...integration.components?.schemas,
        },
        parameters: {
          ...main.components?.parameters,
          ...integration.components?.parameters,
        },
        responses: {
          ...main.components?.responses,
          ...integration.components?.responses,
        },
        securitySchemes: {
          ...main.components?.securitySchemes,
          ...integration.components?.securitySchemes,
        },
      },

      security: [
        ...(main.security ?? []),
        ...(integration.security ?? []),
      ],

      "x-tagGroups": [
        {
          name: "Public API",
          tags: (main.tags ?? []).map((t) => `Public · ${t.name}`),
        },
        {
          name: "Integration API",
          tags: (integration.tags ?? []).map(
            (t) => `Integration · ${t.name}`,
          ),
        },
      ],
    };
  };
