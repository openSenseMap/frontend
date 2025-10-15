import { type LoaderFunctionArgs } from "react-router";
import { getDevice } from "~/models/device.server";

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
 * 		 400:
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

  if (!deviceId) {
    return new Response(JSON.stringify({ message: "Device ID is required." }), {
      status: 400,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  }

  try {
    const device = await getDevice({ id: deviceId });

    if (!device) {
      return new Response(JSON.stringify({ message: "Device not found." }), {
        status: 404,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    return new Response(JSON.stringify(device), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error fetching box:", error);

    if (error instanceof Response) {
      throw error;
    }

    return new Response(
      JSON.stringify({ error: "Internal server error while fetching box" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}
