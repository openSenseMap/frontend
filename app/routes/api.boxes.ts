import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { createDevice, getDevice, getAllDevicesWithSensors } from "~/models/device.server";
import { drizzleClient } from "~/db.server";
import { device } from "~/schema";
import { z } from "zod";
import { transformDeviceToApiFormat } from "~/lib/device-transform";

// Validation schema for box creation based on openSenseMap API format
const CreateBoxSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  exposure: z.enum(["indoor", "outdoor", "mobile", "unknown"]).optional().default("unknown"),
  location: z.array(z.number()).length(2, "Location must be [longitude, latitude]"),
  grouptag: z.array(z.string()).optional().default([]),
  model: z.enum(["homeV2Lora", "homeV2Ethernet", "homeV2Wifi", "senseBox:Edu", "luftdaten.info", "Custom"]).optional().default("Custom"),
  sensors: z.array(z.object({
    id: z.string(),
    icon: z.string().optional(),
    title: z.string().min(1, "Sensor title is required"),
    unit: z.string().min(1, "Sensor unit is required"),
    sensorType: z.string().min(1, "Sensor type is required"),
  })).optional().default([]),
});

/**
 * @openapi
 * /api/boxes:
 *   get:
 *     tags:
 *       - Boxes
 *     summary: Get all boxes
 *     description: Retrieves a list of all public boxes/devices
 *     operationId: getBoxes
 *     responses:
 *       200:
 *         description: Successfully retrieved boxes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Ok"
 *                 data:
 *                   type: object
 *                   properties:
 *                     boxes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Box'
 *                     boxes_count:
 *                       type: integer
 *                       example: 25
 *       500:
 *         description: Internal server error
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

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const bbox = url.searchParams.get('bbox');
    const grouptag = url.searchParams.get('grouptag');
    const model = url.searchParams.get('model');
    const exposure = url.searchParams.get('exposure');
    const near = url.searchParams.get('near');
    const maxDistance = url.searchParams.get('maxDistance');
    const format = url.searchParams.get('format') || 'json';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const devicesWithSensors = await getAllDevicesWithSensors();

    // Apply filters based on query parameters
    let filteredBoxes = devicesWithSensors;

    // Filter by grouptag
    if (grouptag) {
      const tags = grouptag.split(',');
      filteredBoxes = filteredBoxes.filter(device => 
        device.tags && tags.some(tag => device.tags!.includes(tag))
      );
    }

    // Filter by model
    if (model) {
      filteredBoxes = filteredBoxes.filter(device => 
        device.model && device.model.toLowerCase().includes(model.toLowerCase())
      );
    }

    // Filter by exposure
    if (exposure) {
      filteredBoxes = filteredBoxes.filter(device => 
        device.exposure === exposure
      );
    }

    // Filter by bounding box (bbox format: minLon,minLat,maxLon,maxLat)
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      filteredBoxes = filteredBoxes.filter(device => 
        device.longitude >= minLon && 
        device.longitude <= maxLon && 
        device.latitude >= minLat && 
        device.latitude <= maxLat
      );
    }

    // Apply limit (no offset/pagination in original API)
    const limitedBoxes = filteredBoxes.slice(0, limit);

    // Transform boxes data using helper function
    const cleanedBoxes = limitedBoxes.map(box => transformDeviceToApiFormat(box, box.id));

    // Return response based on format
    if (format === 'geojson') {
      return Response.json({
        type: "FeatureCollection",
        features: cleanedBoxes.map(box => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [box.longitude, box.latitude]
          },
          properties: {
            _id: box._id,
            name: box.name,
            grouptag: box.grouptag,
            model: box.model,
            exposure: box.exposure,
            sensors: box.sensors
          }
        }))
      }, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Default JSON format
    return Response.json({
      code: "Ok",
      data: {
        boxes: cleanedBoxes,
        boxes_count: filteredBoxes.length
      },
    }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.warn("Error getting boxes:", err);
    return Response.json({
      code: "Internal Server Error",
      message: "The server was unable to complete your request. Please try again later.",
    }, { status: 500 });
  }
};

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
    } catch (error) {
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
      where: (device, { eq }) => eq(device.id, newBox.id),
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
