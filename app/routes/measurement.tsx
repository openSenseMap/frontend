import { data, type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { measurement, type Measurement } from "~/schema";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, 405);
  }

  try {
    const payload: Measurement[] = await request.json();
    // Validate payload
    if (!Array.isArray(payload) || payload.length === 0) {
      return Response.json({ message: "Invalid payload: expected non-empty array" }, { status: 400 });
    }

    const measurements = payload.map((data) => ({
      sensorId: data.sensorId,
      time: new Date(data.time),
      value: Number(data.value),
    }));

    await drizzleClient.insert(measurement).values(measurements);

    return Response.json({ 
      message: "Measurements created successfully", 
      count: measurements.length 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating measurements:", error);
    return Response.json({ 
      message: "Failed to create measurements",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
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
