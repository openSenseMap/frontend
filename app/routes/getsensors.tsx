import { type LoaderFunctionArgs } from "react-router";
import { getSensors } from "~/models/sensor.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {

    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    if (!deviceId) {
        return new Response(JSON.stringify({ error: "deviceId is required" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    try{
        const sensors = await getSensors(deviceId);
        return new Response(JSON.stringify(sensors), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
        });
    }catch(error){
        return new Response(JSON.stringify({ error: "Failed to fetch sensors" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}

//sensor API spec

export const apiSpec = {
  paths: {
    "/getsensors": {
      get: {
        summary: "Get sensors by deviceId",
        description: "Fetch all sensors associated with the given deviceId",
        tags: ["Sensors"],
        parameters: [
          {
            name: "deviceId",
            in: "query",
            required: true,
            description: "The ID of the device to fetch sensors for",
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "List of sensors",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Sensor"
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request - deviceId is missing",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" }
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
      Sensor: {
        type: "object",
        required: ["id", "createdAt", "updatedAt", "deviceId", "status"],
        properties: {
          id: {
            type: "string",
            description: "Unique sensor identifier"
          },
          title: {
            type: "string",
            nullable: true,
            description: "Human-readable title of the sensor"
          },
          unit: {
            type: "string",
            nullable: true,
            description: "Unit of measurement (e.g., °C, ppm)"
          },
          sensorType: {
            type: "string",
            nullable: true,
            description: "The type/category of the sensor"
          },
          status: {
            type: "string",
            enum: ["inactive", "active", "maintenance", "error"], // adjust based on your actual enum
            description: "Current status of the sensor"
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp when the sensor was created"
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp when the sensor was last updated"
          },
          deviceId: {
            type: "string",
            description: "ID of the device this sensor belongs to"
          },
          sensorWikiType: {
            type: "string",
            nullable: true,
            description: "Sensor type according to sensorWiki"
          },
          sensorWikiPhenomenon: {
            type: "string",
            nullable: true,
            description: "Phenomenon being measured according to sensorWiki"
          },
          sensorWikiUnit: {
            type: "string",
            nullable: true,
            description: "Measurement unit according to sensorWiki"
          },
          lastMeasurement: {
            type: "object",
            nullable: true,
            description: "Most recent measurement taken by this sensor"
          },
          data: {
            type: "object",
            nullable: true,
            description: "Additional sensor-related data (location, measurements, etc.)"
          }
        }
      }
    }
  }
};
