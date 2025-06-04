import { data, type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { measurement, type Measurement } from "~/schema";

/**
 * @swagger
 * /api/measurements:
 *   post:
 *     summary: Create new measurements
 *     description: Submit an array of sensor measurements to be stored in the database
 *     tags:
 *       - Measurements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeasurementArray'
 *     responses:
 *       200:
 *         description: Measurements successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - Invalid data format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, 405);
  }

  try {
    const payload: Measurement[] = await request.json();
    
    // Validate the payload
    if (!Array.isArray(payload) || payload.length === 0) {
      return data({ message: "Invalid data format. Expected non-empty array of measurements." }, 400);
    }

    const measurements = payload.map((data) => ({
      sensorId: data.sensorId,
      time: new Date(data.time),
      value: Number(data.value),
    }));

    await drizzleClient.insert(measurement).values(measurements);

    return data({ success: true }, 200);
  } catch (error) {
    console.error('Error creating measurements:', error);
    return data({ message: "Internal server error" }, 500);
  }
};
