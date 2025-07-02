import swaggerJsdoc from "swagger-jsdoc";

const DEV_SERVER = {
  url: "http://localhost:3000",
  description: "Development server",
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "",
      version: "1.0.0",
      description: `## Documentation of the routes and methods to manage users, stations (also called boxes or senseBoxes), and measurements in the openSenseMap API. You can find the API running at [https://opensensemap.org/api/](https://opensensemap.org/api/).
# Timestamps

## Please note that the API handles every timestamp in Coordinated universal time (UTC) time zone. Timestamps in parameters should be in RFC 3339 notation.

**Timestamp without Milliseconds:**

\`\`\`
2018-02-01T23:18:02Z
\`\`\`

**Timestamp with Milliseconds:**

\`\`\`
2018-02-01T23:18:02.412Z
\`\`\`

# IDs

## All stations and sensors of stations receive a unique public identifier. These identifiers are exactly 24 character long and only contain digits and characters a to f.

**Example:**

\`\`\`
5a8d1c25bc2d41001927a265
\`\`\`

# Parameters

## Only if noted otherwise, all requests assume the payload encoded as JSON with \`Content-type: application/json\` header. Parameters prepended with a colon (\`:\`) are parameters which should be specified through the URL.

# Source code and Licenses

## You can find the whole source code of the API at GitHub in the [sensebox/openSenseMap-API](https://github.com/sensebox/openSenseMap-API) repository. You can obtain the code under the MIT License.

## The data obtainable through the openSenseMap API at [https://opensensemap.org/api/](https://opensensemap.org/api/) is licensed under the [Public Domain Dedication and License 1.0](https://opendatacommons.org/licenses/pddl/summary/).

## If there is something unclear or there is a mistake in this documentation please open an [issue](https://github.com/openSenseMap/frontend/issues/new) in the GitHub repository.`,
    },
    servers: [
      ...(process.env.NODE_ENV !== "production" ? [DEV_SERVER] : []),
      {
        url: process.env.OSEM_API_URL || "https://opensensemap.org/api", // Uses environment variable or defaults to production URL
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        SenseBoxId: {
          type: "string",
          pattern: "^[a-f0-9]{24}$",
          description:
            "Unique identifier for stations and sensors (24 characters, digits and a-f only)",
          example: "5a8d1c25bc2d41001927a265",
        },
        Timestamp: {
          type: "string",
          format: "date-time",
          description: "RFC 3339 timestamp in UTC timezone",
          examples: ["2018-02-01T23:18:02Z", "2018-02-01T23:18:02.412Z"],
        },
      },
      parameters: {
        SenseBoxIdParam: {
          name: "id",
          in: "path",
          required: true,
          schema: {
            $ref: "#/components/schemas/SenseBoxId",
          },
          description: "SenseBox ID parameter",
        },
        TimestampParam: {
          name: "timestamp",
          in: "query",
          schema: {
            $ref: "#/components/schemas/Timestamp",
          },
          description: "Timestamp parameter in RFC 3339 format (UTC)",
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Invalid parameters or payload",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Invalid request parameters",
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Resource not found",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  // Path to the API routes containing JSDoc annotations
  apis: ["./app/routes/api.*.ts"], // Adjust path as needed
};

export const openapiSpecification = () => swaggerJsdoc(options);
