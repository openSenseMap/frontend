import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { getDevice } from '~/models/device.server'

export async function loader({ params }: LoaderFunctionArgs) {
	const { deviceId } = params

	if (!deviceId) {
		return new Response(JSON.stringify({ message: 'Device ID is required.' }), {
			status: 400,
			headers: {
				'content-type': 'application/json; charset=utf-8',
			},
		})
	}

	try {
		const device = await getDevice({ id: deviceId })

		if (!device) {
			return new Response(JSON.stringify({ message: 'Device not found.' }), {
				status: 404,
				headers: {
					'content-type': 'application/json; charset=utf-8',
				},
			})
		}

		return json(device)
	} catch (error) {
		console.error('Error fetching box:', error)

		if (error instanceof Response) {
			throw error
		}

		throw json(
			{ error: 'Internal server error while fetching box' },
			{ status: 500 },
		)
	}
}
