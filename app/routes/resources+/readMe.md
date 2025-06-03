# API Documentation Setup Guide

This guide explains how to set up and maintain dynamic OpenAPI documentation with Swagger UI for the application.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Creating API Specifications](#creating-api-specifications)
3. [Adding New API Routes](#adding-new-api-routes)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Initial Setup

### 1. Install Dependencies (Optional)

Most functionality works with existing Remix dependencies, but you can add validation:

```bash

# Optional: For TypeScript types
npm install openapi3-ts
```

### 2. Create the API Spec Builder

Create `app/lib/api-spec-builder.ts`:

```typescript
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
      title: "Your API Name",
      version: "1.0.0",
      description: "Complete API for your platform",
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

  // Import your API modules here
  const { apiSpec as measurementAPI } = await import("~/routes/measurement");
  // Add more imports as you create new API routes
  
  const apiModules: ApiModule[] = [
    measurementAPI,
    // Add other API modules here
  ];

  // Merge all API specifications
  apiModules.forEach((module, index) => {
    if (!module) {
      console.warn(`API module at index ${index} is undefined`);
      return;
    }

    if (module.paths) {
      Object.assign(baseSpec.paths, module.paths);
    }

    if (module.components?.schemas) {
      Object.assign(baseSpec.components.schemas, module.components.schemas);
    }

    if (module.components?.securitySchemes) {
      Object.assign(baseSpec.components.securitySchemes, module.components.securitySchemes);
    }
  });

  return baseSpec;
}
```

### 3. Create Documentation Routes

Create `app/routes/api.docs.tsx`:

```typescript
import { type LoaderFunctionArgs } from "react-router";
import { buildApiSpecFromRoutes } from "~/lib/api-spec-builder";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Handle JSON spec requests
  if (url.searchParams.get('format') === 'json') {
    try {
      const spec = await buildApiSpecFromRoutes();
      return new Response(JSON.stringify(spec, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error('Error building API spec:', error);
      return new Response(JSON.stringify({ error: 'Failed to build API spec' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Return Swagger UI HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api/docs?format=json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            plugins: [SwaggerUIBundle.plugins.DownloadUrl],
            layout: "StandaloneLayout",
            validatorUrl: null,
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
          });
        };
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};
```

## Creating API Specifications

### Route Structure

For each API route, you need two things:
1. **Route handler** (action/loader functions)
2. **API specification** (apiSpec export)

### Example API Route

Here's how to structure your API routes with documentation:

```typescript
// app/routes/measurement.tsx
import { data, type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import type { Measurement } from "~/schema";

// Your actual route handler
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, 405);
  }

  try {
    const payload: Measurement[] = await request.json();
    
    if (!Array.isArray(payload) || payload.length === 0) {
      return data({ message: "Invalid payload: expected non-empty array" }, 400);
    }

    const measurements = payload.map((data) => ({
      sensorId: data.sensorId,
      time: new Date(data.time),
      value: Number(data.value),
    }));

    await drizzleClient.insert(measurement).values(measurements);

    return data({ 
      message: "Measurements created successfully", 
      count: measurements.length 
    }, 201);
  } catch (error) {
    console.error("Error creating measurements:", error);
    return data({ 
      message: "Failed to create measurements",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
};

// OpenAPI specification for this route
export const apiSpec = {
  paths: {
    "/measurement": {
      post: {
        summary: "Create measurements",
        description: "Create one or multiple sensor measurements",
        tags: ["Measurements"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Measurement"
                }
              },
              example: [
                {
                  sensorId: "sensor-123",
                  time: "2024-01-15T10:30:00Z", 
                  value: 23.5
                }
              ]
            }
          }
        },
        responses: {
          "201": {
            description: "Measurements created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    count: { type: "number" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request - Invalid measurement data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "405": {
            description: "Method not allowed",
            content: {
              "application/json": {
                schema: {
                  type: "object",  
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Measurement: {
        type: "object",
        required: ["sensorId", "time", "value"],
        properties: {
          sensorId: {
            type: "string",
            description: "Unique identifier for the sensor"
          },
          time: {
            type: "string",
            format: "date-time", 
            description: "Timestamp of the measurement"
          },
          value: {
            type: "number",
            description: "Measured value"
          }
        }
      }
    }
  }
};
```

## Adding New API Routes

### Step 1: Create Your Route File

Create a new route file (e.g., `app/routes/sensor.tsx`) with both the handler and apiSpec:

```typescript
// app/routes/sensor.tsx
import { data, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";

// GET /sensor
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  // Your logic here
  const sensors = []; // fetch from database
  
  return data({ sensors, total: sensors.length });
};

// POST /sensor  
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, 405);
  }

  try {
    const payload = await request.json();
    // Your creation logic here
    const newSensor = {}; // create sensor
    
    return data({ sensor: newSensor }, 201);
  } catch (error) {
    return data({ message: "Failed to create sensor" }, 500);
  }
};

// OpenAPI specification
export const apiSpec = {
  paths: {
    "/sensor": {
      get: {
        summary: "Get sensors",
        description: "Retrieve a list of sensors", 
        tags: ["Sensors"],
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "Number of sensors to return",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10
            }
          }
        ],
        responses: {
          "200": {
            description: "List of sensors",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sensors: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Sensor" }
                    },
                    total: { type: "number" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create sensor",
        description: "Create a new sensor",
        tags: ["Sensors"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSensorRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Sensor created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sensor: { $ref: "#/components/schemas/Sensor" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Sensor: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          location: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" }
            }
          },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      CreateSensorRequest: {
        type: "object",
        required: ["name", "location"],
        properties: {
          name: { type: "string" },
          location: {
            type: "object",
            required: ["lat", "lng"],
            properties: {
              lat: { type: "number" },
              lng: { type: "number" }
            }
          }
        }
      }
    }
  }
};
```

### Step 2: Register the New Route

Update `app/lib/api-spec-builder.ts` to include your new route:

```typescript
export async function buildApiSpecFromRoutes() {
  // ... base spec setup ...

  // Import your API modules
  const { apiSpec: measurementAPI } = await import("~/routes/measurement");
  const { apiSpec: sensorAPI } = await import("~/routes/sensor"); // Add this line
  
  const apiModules: ApiModule[] = [
    measurementAPI,
    sensorAPI, // Add this line
    // Add more API modules here
  ];

  // ... rest of the function
}
```

### Step 3: Test Your Documentation

1. Visit `http://localhost:3000/api/docs`
2. Your new endpoint should appear in the Swagger UI
3. Test the "Try it out" functionality

## Best Practices

### 1. Response Structure

Always return proper Response objects from your route handlers:

```typescript
// ✅ Correct
return data({ message: "Success", data: result }, 200);

// ❌ Wrong  
return null;
return result;
```

### 2. Error Handling

Include comprehensive error handling:

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Your logic here
    return data({ success: true }, 200);
  } catch (error) {
    console.error("Route error:", error);
    return data({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
};
```

### 3. OpenAPI Specification Guidelines

- **Use descriptive summaries and descriptions**
- **Include examples in request/response schemas**
- **Specify all possible response codes**
- **Use consistent schema naming**
- **Group related endpoints with tags**

### 4. Schema Reuse

Define reusable schemas to avoid duplication:

```typescript
export const apiSpec = {
  // ... paths ...
  components: {
    schemas: {
      // Base error response used across routes
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          error: { type: "string" }
        }
      },
      // Reuse this in multiple endpoints
      PaginationParams: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 100 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  }
};
```

### 5. Versioning

Consider API versioning in your URLs and documentation:

```typescript
const baseSpec = {
  openapi: "3.0.0",
  info: {
    title: "Your API",
    version: "1.0.0", // Update this when you make breaking changes
    description: "API documentation for version 1.0",
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1", // Include version in URL
      description: "Development server"
    },
  ],
  // ...
};
```

## Troubleshooting

### Common Issues

#### 1. "Parser error" or "Invalid OpenAPI spec"

**Problem**: Swagger UI can't parse your OpenAPI specification.

**Solution**: 
- Check the JSON endpoint directly: `/api/docs?format=json`
- Validate your OpenAPI spec structure
- Look for syntax errors in your apiSpec objects

#### 2. "500 Internal Server Error" on API calls

**Problem**: Route handlers not returning proper Response objects.

**Solution**:
- Ensure all action/loader functions return `data()` or `Response` objects
- Never return `null` or plain objects
- Add proper error handling with try-catch blocks

#### 3. Routes not appearing in documentation

**Problem**: New routes don't show up in Swagger UI.

**Solution**:
- Verify the route file exports an `apiSpec` object
- Check that you've imported and added the route to `api-spec-builder.ts`
- Restart your development server after adding new routes

#### 4. "Try it out" not working

**Problem**: Swagger UI can make requests but they fail.

**Solution**:
- Check CORS settings
- Verify your route URLs match the OpenAPI paths exactly
- Ensure request/response schemas match your actual implementation

### Debugging Tips

1. **Check the JSON spec**: Visit `/api/docs?format=json` to see the raw OpenAPI specification
2. **Console logs**: Check both browser console and server console for errors
3. **Network tab**: Use browser dev tools to see actual API requests/responses
4. **Validate spec**: Use online OpenAPI validators to check your specification

### Getting Help

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [Remix Documentation](https://remix.run/docs)

## Accessing Your Documentation

Once set up, you can access:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/docs?format=json`

The documentation will automatically update as you add new routes following this pattern!