import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	createDevice,
	// deleteDevice,
	getDevice,
	getDevices,
} from '~/models/device.server'
import { ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import {
	deleteDevice,
	type BoxesQueryParams,
} from '~/lib/devices-service.server'
import { Device, User } from '~/schema'

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const searchParams = Object.fromEntries(url.searchParams) as BoxesQueryParams
	const validFormats: BoxesQueryParams['format'] = 'geojson' // TODO: support json

	if (searchParams.format) {
		if (!validFormats.includes(searchParams.format)) {
			console.error('Error in loader:', 'invalid format parameter')
			throw json({ error: 'Failed to fetch devices' }, { status: 422 })
		}
		if (searchParams.format == 'geojson') {
			try {
				let result: GeoJSON.FeatureCollection | any[]

				result = await getDevices()

				if (searchParams.bbox && result) {
					const bboxCoords = searchParams.bbox
						.split(',')
						.map((coord) => Number(coord))
					const [west, south, east, north] = bboxCoords // [minLon, minLat, maxLon, maxLat]
					
					if (
						bboxCoords.length !== 4 ||
						bboxCoords.some((coord) => isNaN(Number(coord)))
					) {
						throw json(
							{
								error:
									"Invalid 'bbox' parameter format. Expected: 'west,south,east,north'",
							},
							{ status: 422 },
						)
					}

					if (
						result &&
						typeof result === 'object' &&
						'type' in result &&
						result.type === 'FeatureCollection'
					) {
						const filteredFeatures = result.features.filter((feature: any) => {
							if (!feature.geometry || !feature.geometry.coordinates) {
								return false
							}

							const [longitude, latitude] = feature.geometry.coordinates

							const isInBounds =
								longitude >= west &&
								longitude <= east &&
								latitude >= south &&
								latitude <= north

							return isInBounds
						})

						result = {
							type: 'FeatureCollection',
							features: filteredFeatures,
						} as GeoJSON.FeatureCollection
					} else if (Array.isArray(result)) {
						result = result.filter((device: any) => {
							if (device.geometry && device.geometry.coordinates) {
								const [longitude, latitude] = device.geometry.coordinates
								return (
									longitude >= west &&
									longitude <= east &&
									latitude >= south &&
									latitude <= north
								)
							}

							if (device.longitude && device.latitude) {
								return (
									device.longitude >= west &&
									device.longitude <= east &&
									device.latitude >= south &&
									device.latitude <= north
								)
							}

							return false
						})
					}
				}

				return result
			} catch (error) {
				console.error('Error in loader:', error)
				throw json({ error: 'Failed to fetch devices' }, { status: 500 })
			}
		}
	}

	if (searchParams.near) {
		const nearCoords = searchParams.near.split(',')
		if (
			nearCoords.length !== 2 ||
			isNaN(Number(nearCoords[0])) ||
			isNaN(Number(nearCoords[1]))
		) {
			throw json(
				{ error: "Invalid 'near' parameter format. Expected: 'lng,lat'" },
				{ status: 422 },
			)
		}
	}
}

export async function action({ request, params }: ActionFunctionArgs) {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return Response.json(
				{
					code: 'Forbidden',
					message:
						'Invalid JWT authorization. Please sign in to obtain new JWT.',
				},
				{
					status: 403,
				},
			)
		switch (request.method) {
			case 'POST':
				return await post(request, jwtResponse)
			case 'DELETE':
				return await del(request, jwtResponse, params)
			default:
				return Response.json({ msg: 'Method Not Allowed' }, { status: 405 })
		}
	} catch (err) {
		console.warn(err)
		return Response.json(
			{
				error: 'Internal Server Error',
				message:
					'The server was unable to complete your request. Please try again later.',
			},
			{
				status: 500,
			},
		)
	}
}

async function del(request: Request, user: User, params: any) {
	const { deviceId } = params

	if (!deviceId) {
		throw json({ message: 'Device ID is required' }, { status: 400 })
	}

	const device = (await getDevice({ id: deviceId })) as unknown as Device

	if (!device) {
		throw json({ message: 'Device not found' }, { status: 404 })
	}

	const body = await request.json()

	if (!body.password) {
		throw json(
			{ message: 'Password is required for device deletion' },
			{ status: 400 },
		)
	}

	try {
		const deleted = await deleteDevice(user, device, body.password)

		if (deleted === 'unauthorized')
			return Response.json(
				{ message: 'Password incorrect' },
				{
					status: 401,
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				},
			)

		return Response.json(null, {
			status: 200,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		})
	} catch (err) {
		console.warn(err)
		return new Response('Internal Server Error', { status: 500 })
	}
}

async function post(request: Request, user: User) {
	try {
		const body = await request.json()

		if (!body.location) {
			throw json(
				{ message: 'missing required parameter location' },
				{ status: 400 },
			)
		}

		let latitude: number, longitude: number, height: number | undefined

		if (Array.isArray(body.location)) {
			// Handle array format [lat, lng, height?]
			if (body.location.length < 2) {
				throw json(
					{
						message: `Illegal value for parameter location. missing latitude or longitude in location [${body.location.join(',')}]`,
					},
					{ status: 422 },
				)
			}
			latitude = Number(body.location[0])
			longitude = Number(body.location[1])
			height = body.location[2] ? Number(body.location[2]) : undefined
		} else if (typeof body.location === 'object' && body.location !== null) {
			// Handle object format { lat, lng, height? }
			if (!('lat' in body.location) || !('lng' in body.location)) {
				throw json(
					{
						message:
							'Illegal value for parameter location. missing latitude or longitude',
					},
					{ status: 422 },
				)
			}
			latitude = Number(body.location.lat)
			longitude = Number(body.location.lng)
			height = body.location.height ? Number(body.location.height) : undefined
		} else {
			throw json(
				{
					message:
						'Illegal value for parameter location. Expected array or object',
				},
				{ status: 422 },
			)
		}

		if (isNaN(latitude) || isNaN(longitude)) {
			throw json(
				{ message: 'Invalid latitude or longitude values' },
				{ status: 422 },
			)
		}

		const rawAuthorizationHeader = request.headers.get('authorization')
		if (!rawAuthorizationHeader) {
			throw json({ message: 'Authorization header required' }, { status: 401 })
		}
		const [, jwtString] = rawAuthorizationHeader.split(' ')

		const deviceData = {
			...body,
			latitude,
			longitude,
		}

		const newDevice = await createDevice(deviceData, user.id)

		return json(
			{
				data: {
					...newDevice,
					access_token: jwtString,
					createdAt: newDevice.createdAt || new Date(),
				},
			},
			{ status: 201 },
		)
	} catch (error) {
		console.error('Error creating device:', error)

		if (error instanceof Response) {
			throw error
		}

		throw json({ message: 'Internal server error' }, { status: 500 })
	}
}
