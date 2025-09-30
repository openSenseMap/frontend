import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { transformDeviceToApiFormat } from "~/lib/device-transform";
import { CreateBoxSchema } from "~/lib/devices-service.server";
import { getUserFromJwt } from "~/lib/jwt";
import { createDevice } from "~/models/device.server";

/**
 * @openapi
 * /api/boxes:
 *   post:
 *     tags:
 *       - Boxes
 *     summary: Create a new box
 *     description: Creates a new box/device with sensors
 *     operationId: createBox
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 description: Box name
 *                 example: "trala"
 *               exposure:
 *                 type: string
 *                 enum: ["indoor", "outdoor", "mobile", "unknown"]
 *                 description: Box exposure type
 *                 example: "mobile"
 *               location:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: Box location as [longitude, latitude]
 *                 example: [-122.406417, 37.785834]
 *               grouptag:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Box group tags
 *                 example: ["bike", "atrai", "arnsberg"]
 *               model:
 *                 type: string
 *                 enum: ["homeV2Lora", "homeV2Ethernet", "homeV2Wifi", "senseBox:Edu", "luftdaten.info", "Custom"]
 *                 description: Box model type
 *                 example: "Custom"
 *               sensors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - title
 *                     - sensorType
 *                     - unit
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Sensor ID
 *                       example: "0"
 *                     icon:
 *                       type: string
 *                       description: Sensor icon
 *                       example: "osem-thermometer"
 *                     title:
 *                       type: string
 *                       description: Sensor title
 *                       example: "Temperature"
 *                     sensorType:
 *                       type: string
 *                       description: Sensor type
 *                       example: "HDC1080"
 *                     unit:
 *                       type: string
 *                       description: Sensor unit
 *                       example: "°C"
 *     responses:
 *       201:
 *         description: Box created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Invalid request data"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Forbidden - invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Invalid JWT authorization. Please sign in to obtain new JWT."
 *       500:
 *         description: Internal server error
 * components:
 *   schemas:
 *     Box:
 *       type: object
 *       description: Box/Device object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique box identifier
 *           example: "clx1234567890abcdef"
 *         name:
 *           type: string
 *           description: Box name
 *           example: "My Weather Station"
 *         description:
 *           type: string
 *           description: Box description
 *           example: "A weather monitoring station"
 *         image:
 *           type: string
 *           format: uri
 *           description: Box image URL
 *           example: "https://example.com/image.jpg"
 *         link:
 *           type: string
 *           format: uri
 *           description: Box website link
 *           example: "https://example.com"
 *         grouptag:
 *           type: array
 *           items:
 *             type: string
 *           description: Box group tags
 *           example: ["weather", "outdoor"]
 *         exposure:
 *           type: string
 *           enum: ["indoor", "outdoor", "mobile", "unknown"]
 *           description: Box exposure type
 *           example: "outdoor"
 *         model:
 *           type: string
 *           enum: ["homeV2Lora", "homeV2Ethernet", "homeV2Wifi", "senseBox:Edu", "luftdaten.info", "Custom"]
 *           description: Box model
 *           example: "homeV2Wifi"
 *         latitude:
 *           type: number
 *           description: Box latitude
 *           example: 52.520008
 *         longitude:
 *           type: number
 *           description: Box longitude
 *           example: 13.404954
 *         useAuth:
 *           type: boolean
 *           description: Whether box requires authentication
 *           example: true
 *         public:
 *           type: boolean
 *           description: Whether box is public
 *           example: false
 *         status:
 *           type: string
 *           enum: ["active", "inactive", "old"]
 *           description: Box status
 *           example: "inactive"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Box creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Box last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Box expiration date
 *           example: "2024-12-31T23:59:59Z"
 *         userId:
 *           type: string
 *           description: Owner user ID
 *           example: "user_123456"
 *         currentLocation:
 *           type: object
 *           description: Current location as GeoJSON Point
 *           properties:
 *             type:
 *               type: string
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [13.404954, 52.520008]
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2023-01-01T00:00:00.000Z"
 *         lastMeasurementAt:
 *           type: string
 *           format: date-time
 *           description: Last measurement timestamp
 *           example: "2023-01-01T00:00:00.000Z"
 *         loc:
 *           type: array
 *           description: Location history as GeoJSON features
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "Feature"
 *               geometry:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [13.404954, 52.520008]
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-01-01T00:00:00.000Z"
 *         integrations:
 *           type: object
 *           description: Box integrations
 *           properties:
 *             mqtt:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   example: false
 *         access_token:
 *           type: string
 *           description: Box access token
 *           example: "abc123def456"
 *         sensors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Sensor ID
 *                 example: "sensor123"
 *               title:
 *                 type: string
 *                 description: Sensor title
 *                 example: "Temperature"
 *               unit:
 *                 type: string
 *                 description: Sensor unit
 *                 example: "°C"
 *               sensorType:
 *                 type: string
 *                 description: Sensor type
 *                 example: "HDC1080"
 *               lastMeasurement:
 *                 type: object
 *                 description: Last measurement data
 *                 properties:
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-01-01T00:00:00.000Z"
 *                   value:
 *                     type: string
 *                     example: "25.13"
 */

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  try {
    // Check authentication
    const jwtResponse = await getUserFromJwt(request);

    if (typeof jwtResponse === "string") {
      return Response.json({
        code: "Forbidden",
        message: "Invalid JWT authorization. Please sign in to obtain new JWT.",
      }, { status: 403 });
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return Response.json({
        code: "Bad Request",
        message: "Invalid JSON in request body",
      }, { status: 400 });
    }

    // Validate request data
    const validationResult = CreateBoxSchema.safeParse(requestData);
    if (!validationResult.success) {
      return Response.json({
        code: "Bad Request",
        message: "Invalid request data",
        errors: validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Extract longitude and latitude from location array [longitude, latitude]
    const [longitude, latitude] = validatedData.location;

    // Create the box using the existing createDevice function
    const newBox = await createDevice({
      name: validatedData.name,
      exposure: validatedData.exposure,
      model: validatedData.model,
      latitude: latitude,
      longitude: longitude,
      tags: validatedData.grouptag,
      sensors: validatedData.sensors.map(sensor => ({
        title: sensor.title,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
      })),
    }, jwtResponse.id);

    // Fetch the sensors for the created device
    const deviceWithSensors = await drizzleClient.query.device.findFirst({
      where: (devices, { eq }) => eq(devices.id, newBox.id),
      with: {
        sensors: true,
      },
    });

    // Build response object using helper function
    if (!deviceWithSensors) {
      return Response.json({
        code: "Internal Server Error",
        message: "Failed to retrieve created device",
      }, { status: 500 });
    }
    
    const responseData = transformDeviceToApiFormat(deviceWithSensors, deviceWithSensors.id);

    return Response.json(responseData, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error creating box:", err);
    return Response.json({
      code: "Internal Server Error",
      message: "The server was unable to create the box. Please try again later.",
    }, { status: 500 });
  }
};
