import { apiSpec as measurementAPI } from "~/routes/measurement";
import { apiSpec as sensorAPI } from "~/routes/getsensors";

interface ApiModule {
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export async function buildApiSpecFromRoutes() {
  const baseSpec = {
    openapi: "3.0.0",
    info: {
      title: "openSenseMap API",
      version: "1.0.0",
      description: `Complete API for openSenseMap platform

## Timestamps

Please note that the API handles every timestamp in Coordinated universal time (UTC) time zone. Timestamps in parameters should be in RFC 3339 notation.

**Timestamp without Milliseconds:**
\`\`\`
2018-02-01T23:18:02Z
\`\`\`

**Timestamp with Milliseconds:**
\`\`\`
2018-02-01T23:18:02.412Z
\`\`\`

## IDs

All stations and sensors of stations receive a unique public identifier. These identifiers are exactly 24 character long and only contain digits and characters a to f.

**Example:**
\`\`\`
5a8d1c25bc2d41001927a265
\`\`\`

## Parameters

Only if noted otherwise, all requests assume the payload encoded as JSON with \`Content-type: application/json\` header. Parameters prepended with a colon (\`:\`) are parameters which should be specified through the URL.

## Source code and Licenses

You can find the whole source code of the API at GitHub in the [sensebox/openSenseMap-API](https://github.com/sensebox/openSenseMap-API) repository. You can obtain the code under the MIT License.

The data obtainable through the openSenseMap API at https://api.opensensemap.org/ is licensed under the Public Domain Dedication and License 1.0.

If there is something unclear or there is a mistake in this documentation please open an issue in the GitHub repository.`,
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server"
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer"
        }
      }
    }
  };

  try {
    // Collect all API modules
    const apiModules: ApiModule[] = [
      measurementAPI,
      sensorAPI
      // Add other API modules here as you create them
      // sensorAPI,
      // userAPI,
      // etc.
    ];

    // Merge all API specifications
    apiModules.forEach((module, index) => {
      if (!module) {
        console.warn(`API module at index ${index} is undefined`);
        return;
      }

      // Merge paths
      if (module.paths) {
        Object.assign(baseSpec.paths, module.paths);
      }

      // Merge schemas
      if (module.components?.schemas) {
        Object.assign(baseSpec.components.schemas, module.components.schemas);
      }

      // Merge security schemes if any
      if (module.components?.securitySchemes) {
        Object.assign(baseSpec.components.securitySchemes, module.components.securitySchemes);
      }
    });

    return baseSpec;
  } catch (error) {
    console.error('Error in buildApiSpecFromRoutes:', error);
    throw error;
  }
}
