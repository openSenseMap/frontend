import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	createDevice,
	findDevices,
	FindDevicesOptions,
	// deleteDevice,
	getDevice,
	getDevices,
	getDevicesWithSensors,
} from '~/models/device.server'
import { ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import {
	BoxesQuerySchema,
	deleteDevice,
	type BoxesQueryParams,
} from '~/lib/devices-service.server'
import { Device, DeviceExposureType, User } from '~/schema'
import { Point } from 'geojson'

function fromToTimeParamsSanityCheck(fromDate: Date | null, toDate: Date | null) {
	if ((fromDate && !toDate) || (toDate && !fromDate)) {
	  throw json(
		{ error: 'fromDate and toDate need to be specified simultaneously' },
		{ status: 400 }
	  );
	}
  
	if (fromDate && toDate) {
	  if (fromDate.getTime() > toDate.getTime()) {
		throw json(
		  { error: `Invalid time frame specified: fromDate (${fromDate.toISOString()}) is after toDate (${toDate.toISOString()})` },
		  { status: 422 }
		);
	  }
	}
  }
  
  function parseAndValidateTimeParams(searchParams: URLSearchParams) {
	const dateParams = searchParams.getAll('date');
	
	if (dateParams.length === 0) {
	  return { fromDate: null, toDate: null };
	}
  
	if (dateParams.length > 2) {
	  throw json(
		{ error: 'invalid number of dates for date parameter supplied' },
		{ status: 422 }
	  );
	}
  
	const [fromDateStr, toDateStr] = dateParams;
	
	const fromDate = new Date(fromDateStr);
	if (isNaN(fromDate.getTime())) {
	  throw json(
		{ error: `Invalid date format: ${fromDateStr}` },
		{ status: 422 }
	  );
	}
  
	let toDate: Date;
	
	if (!toDateStr) {
	  // If only one date provided, create a range of ±4 hours
	  toDate = new Date(fromDate.getTime() + (4 * 60 * 60 * 1000)); // +4 hours
	  const adjustedFromDate = new Date(fromDate.getTime() - (4 * 60 * 60 * 1000)); // -4 hours
	  
	  return { fromDate: adjustedFromDate, toDate };
	} else {
	  toDate = new Date(toDateStr);
	  if (isNaN(toDate.getTime())) {
		throw json(
		  { error: `Invalid date format: ${toDateStr}` },
		  { status: 422 }
		);
	  }
	  
	  fromToTimeParamsSanityCheck(fromDate, toDate);
	  
	  return { fromDate, toDate };
	}
  }

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
	const url = new URL(request.url);
	const queryObj = Object.fromEntries(url.searchParams);
	const max_limit = 20;
	const { fromDate, toDate } = parseAndValidateTimeParams(url.searchParams);
	const parseResult = BoxesQuerySchema.safeParse(queryObj);
  
	if (!parseResult.success) {
		const { fieldErrors, formErrors } = parseResult.error.flatten();
		if (fieldErrors.format) {
			throw json(
			  { error: "Invalid format parameter" },
			  { status: 422 }
			);
		  }

		throw json(
		{ error: parseResult.error.flatten() },
		{ status: 422 }
		);
	}

	const params: FindDevicesOptions = parseResult.data;

	const devices = await findDevices(params)

	if (params.format === "geojson"){		
		const geojson = {
			type: 'FeatureCollection',
			features: devices.map((device: Device) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [device.longitude, device.latitude]
				},
				properties: {
					...device
				}
			}))
		};

		return geojson;
	}
	else {
		return devices
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
