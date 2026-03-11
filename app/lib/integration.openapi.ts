import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OpenSenseMap Integration API",
      version: "1.0.0",
      description: `
# Building OpenSenseMap Integrations

OpenSenseMap uses a plugin architecture for integrations. Any service implementing this specification can connect devices from any platform or protocol to OpenSenseMap.

## Architecture

\`\`\`
OpenSenseMap (Main App)
    ↓ Registers & calls via HTTP
Your Integration Service
    ↓ Receives data from
Your Protocol (MQTT/LoRa/etc.)
\`\`\`

## Required Endpoints

Your integration service MUST implement these endpoints:

1. **GET /integrations/:deviceId** - Get integration config
2. **PUT /integrations/:deviceId** - Create/update integration config
3. **DELETE /integrations/:deviceId** - Delete integration config
4. **GET /integrations/schema/{name}** - Return JSON Schema for config form
5. **GET /health** - Health check

## Authentication

All endpoints (except /health) require \`x-service-key\` header.

## Forwarding Measurements

After processing data, POST measurements to OpenSenseMap:

**Endpoint:** \`POST /api/boxes/:deviceId/:sensorId\`

**Headers:**
- \`Content-Type: application/json\`
- \`x-service-key\`: Your service key (provided by OpenSenseMap)

**Body:**
\`\`\`json
{
  "value": 23.5,
  "createdAt": "2026-02-06T10:00:00Z",
  "location": {
    "lng": 7.628,
    "lat": 51.963,
    "height": 100
  }
}
\`\`\`

## Reference Implementations

- [MQTT Integration](https://github.com/opensensemap/mqtt-integration)
- [TTN Integration](https://github.com/opensensemap/ttn-integration)

## Registration

To register your integration, contact OpenSenseMap admins with:
- Service name and description
- Service URL and authentication key
- Icon (Lucide icon name)
- JSON Schema endpoint path
      `,
    },
    servers: [
      {
        url: "https://your-integration-service.com",
        description: "Your integration microservice",
      },
    ],
    components: {
      securitySchemes: {
        ServiceKey: {
          type: "apiKey",
          in: "header",
          name: "x-service-key",
          description: "Service authentication key configured in OpenSenseMap",
        },
      },
      parameters: {
        DeviceId: {
          name: "deviceId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "OpenSenseMap device ID",
          example: "cm65qexample123",
        },
      },
      schemas: {
        IntegrationConfig: {
          type: "object",
          description: "Integration configuration (schema varies by integration type)",
          additionalProperties: true,
          example: {
            id: "intg_123",
            deviceId: "cm65qexample123",
            enabled: true,
            url: "mqtt://broker.example.com",
            topic: "sensors/data",
            messageFormat: "json",
          },
        },
        JsonSchema: {
          type: "object",
          description: "JSON Schema (draft-07) for dynamic form generation",
          properties: {
            schema: {
              type: "object",
              description: "JSON Schema definition",
            },
            uiSchema: {
              type: "object",
              description: "React JSON Schema Form UI Schema",
            },
          },
          required: ["schema"],
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
            },
            details: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Integration not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Validation failed",
                details: [
                  "url is required and must be a string",
                  "topic is required and must be a string",
                ],
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized - invalid or missing service key",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Unauthorized",
              },
            },
          },
        },
        InternalError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Internal server error",
              },
            },
          },
        },
      },
    },
    security: [
      {
        ServiceKey: [],
      },
    ],
    tags: [
      {
        name: "Integration Management",
        description: "CRUD operations for integration configurations",
      },
      {
        name: "Schema",
        description: "JSON Schema for dynamic form generation",
      },
      {
        name: "Health",
        description: "Service health check",
      },
    ],
    paths: {
      "/integrations/{deviceId}": {
        get: {
          summary: "Get integration configuration for a device",
          operationId: "getIntegration",
          tags: ["Integration Management"],
          parameters: [
            {
              $ref: "#/components/parameters/DeviceId",
            },
          ],
          responses: {
            "200": {
              description: "Integration configuration",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/IntegrationConfig",
                  },
                },
              },
            },
            "404": {
              $ref: "#/components/responses/NotFound",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalError",
            },
          },
        },
        put: {
          summary: "Create or update integration configuration",
          operationId: "createOrUpdateIntegration",
          tags: ["Integration Management"],
          parameters: [
            {
              $ref: "#/components/parameters/DeviceId",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Configuration specific to your integration type",
                  additionalProperties: true,
                },
                examples: {
                  mqtt: {
                    summary: "MQTT Integration",
                    value: {
                      url: "mqtt://broker.example.com:1883",
                      topic: "sensors/temperature",
                      messageFormat: "json",
                      connectionOptions: {
                        username: "user",
                        password: "pass",
                      },
                    },
                  },
                  ttn: {
                    summary: "TTN Integration",
                    value: {
                      devId: "my-device",
                      appId: "my-app",
                      profile: "cayenne-lpp",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Integration updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/IntegrationConfig",
                  },
                },
              },
            },
            "201": {
              description: "Integration created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/IntegrationConfig",
                  },
                },
              },
            },
            "400": {
              $ref: "#/components/responses/ValidationError",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalError",
            },
          },
        },
        delete: {
          summary: "Delete integration configuration",
          operationId: "deleteIntegration",
          tags: ["Integration Management"],
          parameters: [
            {
              $ref: "#/components/parameters/DeviceId",
            },
          ],
          responses: {
            "204": {
              description: "Integration deleted successfully",
            },
            "404": {
              $ref: "#/components/responses/NotFound",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalError",
            },
          },
        },
      },
      "/integrations/schema/{integrationName}": {
        get: {
          summary: "Get JSON Schema for integration configuration form",
          operationId: "getIntegrationSchema",
          tags: ["Schema"],
          parameters: [
            {
              name: "integrationName",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              example: "mqtt",
            },
          ],
          responses: {
            "200": {
              description: "JSON Schema for dynamic form generation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/JsonSchema",
                  },
                  examples: {
                    mqtt: {
                      summary: "MQTT Schema Example",
                      value: {
                        schema: {
                          type: "object",
                          required: ["url", "topic", "messageFormat"],
                          properties: {
                            url: {
                              type: "string",
                              title: "Broker URL",
                              pattern: "^(mqtt|mqtts|ws|wss)://.+",
                            },
                            topic: {
                              type: "string",
                              title: "Topic",
                            },
                            messageFormat: {
                              type: "string",
                              title: "Message Format",
                              enum: ["json", "csv"],
                            },
                          },
                        },
                        uiSchema: {
                          "ui:order": ["url", "topic", "messageFormat"],
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalError",
            },
          },
        },
      },
      "/health": {
        get: {
          summary: "Health check endpoint",
          operationId: "healthCheck",
          tags: ["Health"],
          security: [],
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "healthy",
                      },
                      timestamp: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const integrationOpenapiSpecification = () => swaggerJsdoc(options);