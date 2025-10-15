import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { transformDeviceToApiFormat } from "~/lib/device-transform";
import { getUserFromJwt } from '~/lib/jwt'
import { getDevice, updateDevice, type UpdateDeviceArgs } from "~/models/device.server";
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

export async function action({ request, params }: ActionFunctionArgs) {
	const { deviceId } = params

	if (!deviceId) {
		return Response.json({ error: 'Device ID is required.' }, { status: 400 })
	}

	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string') {
			return Response.json(
				{
					code: 'Forbidden',
					message: 'Invalid JWT authorization. Please sign in to obtain a new JWT.',
				},
				{ status: 403 },
			)
		}

		switch (request.method) {
			case 'PUT':
				return await put(request, jwtResponse, deviceId)
			default:
				return Response.json({ message: 'Method Not Allowed' }, { status: 405 })
		}
	} catch (error) {
		console.error('Error in device action:', error)
		return Response.json({ error: 'Internal server error' }, { status: 500 })
	}
}

async function put(request: Request, user: any, deviceId: string) {
	try {
		const body = await request.json()

		const updateArgs: UpdateDeviceArgs = {
			name: body.name,
			exposure: body.exposure,
			description: body.description,
			image: body.image,
			model: body.model,
			useAuth: body.useAuth,
			link: body.weblink,
			location: body.location,
			grouptag: Array.isArray(body.grouptag)
				? body.grouptag[0]
				: body.grouptag,
		}

		const updatedDevice = await updateDevice(deviceId, updateArgs)

		const deviceWithSensors = await getDevice({id: updatedDevice.id})

		const apiResponse = transformDeviceToApiFormat(deviceWithSensors as any)

		return Response.json(apiResponse, { status: 200 })
	} catch (error) {
		console.error('Error updating device:', error)
		return Response.json({ error: 'Failed to update device' }, { status: 500 })
	}
}
