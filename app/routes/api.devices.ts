import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router'
import { BoxesQuerySchema, deleteDevice } from '~/lib/devices-service.server'
import { getUserFromJwt } from '~/lib/jwt'
import {
	createDevice,
	findDevices,
	getDevice,
	type FindDevicesOptions,
} from '~/models/device.server'
import { type Device, type User } from '~/schema'
import { StandardResponse } from '~/utils/response-utils'

/**
 * @openapi
 * /api/devices:
 *   get:
 *     tags:
 *       - Devices
 *     summary: Get devices with filtering options
 *     description: Retrieves devices based on various filter criteria. Supports both JSON and GeoJSON formats.
 *     parameters:
 *       - name: format
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [json, geojson]
 *           default: json
 *         description: Response format
 *       - name: minimal
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Return minimal device information
 *       - name: full
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Return full device information
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of devices to return
 *       - name: name
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter devices by name
 *       - name: phenomenon
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter devices by phenomenon type
 *       - name: fromDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter devices from this date
 *         example: "2023-05-15T10:00:00Z"
 *       - name: toDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter devices to this date
 *         example: "2023-05-15T12:00:00Z"
 *       - name: grouptag
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter devices by group tag
 *       - name: exposure
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter devices by exposure type
 *       - name: near
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^-?\d+\.?\d*,-?\d+\.?\d*$'
 *         description: Find devices near coordinates (lat,lng)
 *         example: "52.5200,13.4050"
 *       - name: maxDistance
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *           default: 1000
 *         description: Maximum distance in meters when using 'near' parameter
 *       - name: bbox
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$'
 *         description: Bounding box coordinates (swLng,swLat,neLng,neLat)
 *         example: "13.2,52.4,13.6,52.6"
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Specific date filter (TODO - not implemented)
 *     responses:
 *       200:
 *         description: Successfully retrieved devices
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *                 - $ref: '#/components/schemas/GeoJSONFeatureCollection'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidFormat:
 *                 summary: Invalid format parameter
 *                 value:
 *                   error: "Failed to fetch devices"
 *               invalidLimit:
 *                 summary: Invalid limit parameter
 *                 value:
 *                   error: "Limit must be at least 1"
 *               exceedsLimit:
 *                 summary: Limit exceeds maximum
 *                 value:
 *                   error: "Limit should not exceed 20"
 *               invalidNear:
 *                 summary: Invalid near parameter
 *                 value:
 *                   error: "Invalid 'near' parameter format. Expected: 'lat,lng'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Failed to fetch devices"
 *
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - id
 *         - latitude
 *         - longitude
 *       properties:
 *         id:
 *           type: string
 *           description: Unique device identifier
 *           example: "device-123"
 *         name:
 *           type: string
 *           description: Device name
 *           example: "Temperature Sensor A1"
 *         latitude:
 *           type: number
 *           format: float
 *           description: Device latitude coordinate
 *           example: 52.5200
 *         longitude:
 *           type: number
 *           format: float
 *           description: Device longitude coordinate
 *           example: 13.4050
 *         phenomenon:
 *           type: string
 *           description: Type of phenomenon measured
 *           example: "temperature"
 *         grouptag:
 *           type: string
 *           description: Group tag for device categorization
 *           example: "outdoor-sensors"
 *         exposure:
 *           type: string
 *           description: Device exposure type
 *           example: "outdoor"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Device creation timestamp
 *           example: "2023-05-15T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Device last update timestamp
 *           example: "2023-05-15T12:00:00Z"
 *
 *     GeoJSONFeatureCollection:
 *       type: object
 *       required:
 *         - type
 *         - features
 *       properties:
 *         type:
 *           type: string
 *           enum: [FeatureCollection]
 *           example: "FeatureCollection"
 *         features:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GeoJSONFeature'
 *
 *     GeoJSONFeature:
 *       type: object
 *       required:
 *         - type
 *         - geometry
 *         - properties
 *       properties:
 *         type:
 *           type: string
 *           enum: [Feature]
 *           example: "Feature"
 *         geometry:
 *           $ref: '#/components/schemas/GeoJSONPoint'
 *         properties:
 *           $ref: '#/components/schemas/Device'
 *
 *     GeoJSONPoint:
 *       type: object
 *       required:
 *         - type
 *         - coordinates
 *       properties:
 *         type:
 *           type: string
 *           enum: [Point]
 *           example: "Point"
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *           minItems: 2
 *           maxItems: 2
 *           description: Longitude and latitude coordinates
 *           example: [13.4050, 52.5200]
 *
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Failed to fetch devices"
 */
export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const queryObj = Object.fromEntries(url.searchParams)
	const max_limit = 20
	const parseResult = BoxesQuerySchema.safeParse(queryObj)

	if (!parseResult.success) {
		const { fieldErrors, formErrors } = parseResult.error.flatten()
		if (fieldErrors.format)
			throw StandardResponse.unprocessableContent('Invalid format parameter')

		throw StandardResponse.unprocessableContent(
			`${parseResult.error.flatten()}`,
		)
	}

	const params: FindDevicesOptions = parseResult.data

	const devices = await findDevices(params)

	if (params.format === 'geojson') {
		const geojson = {
			type: 'FeatureCollection',
			features: devices.map((device: Device) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [device.longitude, device.latitude],
				},
				properties: {
					...device,
				},
			})),
		}

		return geojson
	} else {
		return devices
	}
}

export async function action({ request, params }: ActionFunctionArgs) {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)
		switch (request.method) {
			case 'POST':
				return await post(request, jwtResponse)
			case 'DELETE':
				return await del(request, jwtResponse, params)
			default:
				return StandardResponse.methodNotAllowed('Method Not Allowed')
		}
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}

async function del(request: Request, user: User, params: any) {
	const { deviceId } = params

	if (!deviceId) throw StandardResponse.badRequest('Device ID is required')

	const device = (await getDevice({ id: deviceId })) as unknown as Device

	if (!device) throw StandardResponse.notFound('Device not found')

	const body = await request.json()

	if (!body.password)
		throw StandardResponse.badRequest(
			'Password is required for device deletion',
		)

	try {
		const deleted = await deleteDevice(user, device, body.password)

		if (deleted === 'unauthorized')
			return StandardResponse.unauthorized('Password incorrect')

		return StandardResponse.ok(null)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}

async function post(request: Request, user: User) {
	try {
		const body = await request.json()

		if (!body.location)
			throw StandardResponse.badRequest('missing required parameter location')

		let latitude: number, longitude: number, height: number | undefined

		if (Array.isArray(body.location)) {
			// Handle array format [lat, lng, height?]
			if (body.location.length < 2)
				throw StandardResponse.unprocessableContent(
					`Illegal value for parameter location. missing latitude or longitude in location [${body.location.join(',')}]`,
				)

			latitude = Number(body.location[0])
			longitude = Number(body.location[1])
			height = body.location[2] ? Number(body.location[2]) : undefined
		} else if (typeof body.location === 'object' && body.location !== null) {
			// Handle object format { lat, lng, height? }
			if (!('lat' in body.location) || !('lng' in body.location))
				throw StandardResponse.unprocessableContent(
					'Illegal value for parameter location. missing latitude or longitude',
				)

			latitude = Number(body.location.lat)
			longitude = Number(body.location.lng)
			height = body.location.height ? Number(body.location.height) : undefined
		} else
			throw StandardResponse.unprocessableContent(
				'Illegal value for parameter location. Expected array or object',
			)

		if (isNaN(latitude) || isNaN(longitude))
			throw StandardResponse.unprocessableContent(
				'Invalid latitude or longitude values',
			)

		const rawAuthorizationHeader = request.headers.get('authorization')
		if (!rawAuthorizationHeader)
			throw StandardResponse.unauthorized('Authorization header required')

		const [, jwtString] = rawAuthorizationHeader.split(' ')

		const deviceData = {
			...body,
			latitude,
			longitude,
		}

		const newDevice = await createDevice(deviceData, user.id)

		return StandardResponse.created({
			data: {
				...newDevice,
				createdAt: newDevice.createdAt || new Date(),
			},
		})
	} catch (error) {
		console.error('Error creating device:', error)

		if (error instanceof Response) {
			throw error
		}

		throw Response.json({ message: 'Internal server error' }, { status: 500 })
	}
}
