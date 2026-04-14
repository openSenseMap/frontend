import { type OpenAPIV3 } from "openapi-types";
import { integrationOpenapiSpecification } from "./integration.openapi";
import { openapiSpecification } from "./openapi";

type OpenAPIDocumentWithTagGroups = OpenAPIV3.Document & {
  "x-tagGroups"?: Array<{ name: string; tags: string[] }>;
};

const tagAnchor = (tag: string) => `#/${encodeURIComponent(tag)}`;

function collectOperationTagNames(paths?: OpenAPIV3.PathsObject): string[] {
  if (!paths) return [];

  const set = new Set<string>();

  for (const pathItem of Object.values(paths)) {
    const item = (pathItem ?? {}) as OpenAPIV3.PathItemObject;

    const methods = [
      "get",
      "put",
      "post",
      "delete",
      "patch",
      "options",
      "trace", 
    ] as const;

    for (const m of methods) {
      const op = item[m];
      if (!op?.tags) continue;
      for (const t of op.tags) set.add(t);
    }
  }

  return [...set];
}

function prefixOperationTags(
  paths: OpenAPIV3.PathsObject | undefined,
  prefix: string,
): OpenAPIV3.PathsObject {
  const result: OpenAPIV3.PathsObject = {};
  if (!paths) return result;

  for (const [path, pathItem] of Object.entries(paths)) {
    const item = (pathItem ?? {}) as OpenAPIV3.PathItemObject;
    const out: OpenAPIV3.PathItemObject = { ...item };

    const methods = [
      "get",
      "put",
      "post",
      "delete",
      "patch",
      "options",
    ] as const;

    for (const m of methods) {
      const op = item[m];
      if (!op) continue;

      out[m] = {
        ...op,
        tags: op.tags?.map((t) => `${prefix} · ${t}`),
      };
    }

    result[path] = out;
  }

  return result;
}

function mergeComponents(
  a?: OpenAPIV3.ComponentsObject,
  b?: OpenAPIV3.ComponentsObject,
): OpenAPIV3.ComponentsObject | undefined {
  if (!a && !b) return undefined;
  return {
    ...(a ?? {}),
    ...(b ?? {}),
    schemas: { ...(a?.schemas ?? {}), ...(b?.schemas ?? {}) },
    parameters: { ...(a?.parameters ?? {}), ...(b?.parameters ?? {}) },
    responses: { ...(a?.responses ?? {}), ...(b?.responses ?? {}) },
    securitySchemes: { ...(a?.securitySchemes ?? {}), ...(b?.securitySchemes ?? {}) },
  };
}

export const combinedOpenapiSpecification = (): OpenAPIDocumentWithTagGroups => {
  const main = openapiSpecification() as OpenAPIV3.Document;
  const integration = integrationOpenapiSpecification() as OpenAPIV3.Document;

  const mainTagNames =
    (main.tags?.map((t) => t.name) ?? []).length > 0
      ? main.tags!.map((t) => t.name)
      : collectOperationTagNames(main.paths);

  const integrationTagNames =
    (integration.tags?.map((t) => t.name) ?? []).length > 0
      ? integration.tags!.map((t) => t.name)
      : collectOperationTagNames(integration.paths);

  const publicTags: OpenAPIV3.TagObject[] =
    (main.tags?.length ?? 0) > 0
      ? main.tags!.map((t) => ({ ...t, name: `Public · ${t.name}` }))
      : mainTagNames
          .sort()
          .map((name) => ({ name: `Public · ${name}` }));

  const integrationTags: OpenAPIV3.TagObject[] =
    (integration.tags?.length ?? 0) > 0
      ? integration.tags!.map((t) => ({ ...t, name: `Integration · ${t.name}` }))
      : integrationTagNames
          .sort()
          .map((name) => ({ name: `Integration · ${name}` }));

  const allTags = [...publicTags, ...integrationTags];

  const publicJump = publicTags[0]?.name;
  const integrationJump = integrationTags[0]?.name;

  const topLinks = [
    publicJump ? `- [Public API](${tagAnchor(publicJump)})` : `- Public API`,
    integrationJump
      ? `- [Integration API](${tagAnchor(integrationJump)})`
      : `- Integration API`,
  ].join("\n");

  return {
    ...main,

    info: {
      ...main.info,
      title: "OpenSenseMap API",
      description: `# OpenSenseMap API Documentation

Use the links below or the sidebar to navigate.

${topLinks}
`,
    },

    // Public first => Integration appears below in Swagger UI (assuming no tagsSorter="alpha")
    tags: allTags,

    paths: {
      ...prefixOperationTags(main.paths, "Public"),
      ...prefixOperationTags(integration.paths, "Integration"),
    },

    components: mergeComponents(main.components, integration.components),

    security: [...(main.security ?? []), ...(integration.security ?? [])],

    "x-tagGroups": [
      {
        name: "Public API",
        tags: publicTags.map((t) => t.name),
      },
      {
        name: "Integration API",
        tags: integrationTags.map((t) => t.name),
      },
    ],
  };
};
