import { data, type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { measurement, type Measurement } from "~/schema";

/**
 * @openapi
 * /api/measurements:
 *   post:
 *     tags:
 *       - Measurements
 *     summary: Create new measurements
 *     description: Accepts an array of measurement data and stores it in the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Measurement'
 *             example:
 *               - sensorId: "sensor-123"
 *                 time: "2023-05-15T10:00:00Z"
 *                 value: 25.4
 *               - sensorId: "sensor-456"
 *                 time: "2023-05-15T10:01:00Z"
 *                 value: 22.1
 *     responses:
 *       200:
 *         description: Measurements successfully stored (empty response)
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Method not allowed"
 * 
 * components:
 *   schemas:
 *     Measurement:
 *       type: object
 *       required:
 *         - sensorId
 *         - time
 *         - value
 *       properties:
 *         sensorId:
 *           type: string
 *           description: Unique identifier for the sensor
 *           example: "sensor-123"
 *         time:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the measurement
 *           example: "2023-05-15T10:00:00Z"
 *         value:
 *           type: number
 *           format: float
 *           description: Measured value
 *           example: 25.4
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, 405);
  }
  const payload: Measurement[] = await request.json();
  const measurements = payload.map((data) => ({
    sensorId: data.sensorId,
    time: new Date(data.time),
    value: Number(data.value),
  }));

  const result = await drizzleClient.insert(measurement).values(measurements);

 return Response.json(result);
};
