import { type LoaderFunctionArgs } from "react-router";
import { getDevice } from "~/models/device.server";
import { StandardResponse } from "~/utils/response-utils";

/**
 * @openapi
 * /api/device/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     description: Retrieve a single device by their unique identifier
 *     tags:
 *       - Device
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the user
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12345"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-01-15T10:30:00Z"
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Device not found"
 *       400:
 *         description: Device ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Device ID is required."
 *       500:
 *         description: Internal server error
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { deviceId } = params;

  if (!deviceId)
    return StandardResponse.badRequest("Device ID is required.");

  try {
    const device = await getDevice({ id: deviceId });

    if (!device)
      return StandardResponse.notFound("Device not found.");

    return StandardResponse.ok(JSON.stringify(device));
  } catch (error) {
    console.error("Error fetching box:", error);

    return StandardResponse.internalServerError();
  }
}
