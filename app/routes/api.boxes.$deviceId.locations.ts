import { type Params, type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { type TransformedMeasurement, transformOutliers } from "~/lib/outlier-transform";
import { getDevice } from "~/models/device.server";
import { getMeasurements } from "~/models/sensor.server";
import { type Measurement } from "~/schema";
import { convertToCsv } from "~/utils/csv";
import { parseDateParam, parseEnumParam } from "~/utils/param-utils";
import { badRequest, internalServerError, notFound } from "~/utils/response-utils";

/**
 * @openapi
 * /boxes/{deviceId}/locations:
 *   get:
 *    tags:
 *      - Boxes
 *    summary: Get locations of a senseBox
 *    description: Get all locations of the specified senseBox ordered by date as an array of GeoJSON Points.
 *      If `format=geojson`, a GeoJSON linestring will be returned, with `properties.timestamps`
 *      being an array with the timestamp for each coordinate.
 *    parameters:
 *      - in: path
 *        name: deviceId
 *        required: true
 *        schema:
 *          type: string
 *        description: the ID of the senseBox you are referring to
 *      - in: query
 *        name: from-date
 *        required: false
 *        schema:
 *          type: string
 *          description: RFC3339Date
 *          format: date-time
 *        description: "Beginning date of measurement data (default: 48 hours ago from now)"
 *      - in: query
 *        name: to-date
 *        required: false
 *        schema:
 *          type: string
 *          descrption: TFC3339Date
 *          format: date-time
 *        description: "End date of measurement data (default: now)"
 *      - in: query
 *        name: format
 *        required: false
 *        schema:
 *          type: string
 *          enum:
 *            - json
 *            - geojson
 *          default: json
 *        description: "Can be 'json' (default) or 'geojson' (default: json)"
 *    responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               example: '[{ "coordinates": [7.68123, 51.9123], "type": "Point", "timestamp": "2017-07-27T12:00:00Z"},{ "coordinates": [7.68223, 51.9433, 66.6], "type": "Point", "timestamp": "2017-07-27T12:01:00Z"},{ "coordinates": [7.68323, 51.9423], "type": "Point", "timestamp": "2017-07-27T12:02:00Z"}]'
 *           application/geojson:
 *             example: ''
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<Response> => {
  try {

    const collected = collectParameters(request, params);
    if (collected instanceof Response)
      return collected;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {deviceId, fromDate, toDate, format} = collected;

    const device = await getDevice({ id: deviceId });
    if (!device)
      return notFound("Device not found");

    const locations = device.locations.filter(location =>
      new Date(location.time) >= fromDate && new Date(location.time) <= toDate);

    const jsonLocations = locations.map((location) => {
      return {
        coordinates: [location.geometry.x, location.geometry.y],
        type: 'Point',
        timestamp: location.time,
      }
    });

    let headers: HeadersInit = {
        "content-type": format == "json" ? "application/json; charset=utf-8" : "application/geo+json; charset=utf-8",
    };

    const responseInit: ResponseInit = {
      status: 200,
      headers: headers,
    };

    if (format == "json")
      return Response.json(jsonLocations, responseInit);
    else {
      const geoJsonLocations =  {
          type: 'Feature',
          geometry: {
            type: 'LineString', coordinates: jsonLocations.map(location => location.coordinates)
          },
          properties: {
            timestamps: jsonLocations.map(location => location.timestamp)
          }
        };
      return Response.json(geoJsonLocations, responseInit)
    }

  } catch (err) {
    console.warn(err);
    return internalServerError();
  }
};

function collectParameters(request: Request, params: Params<string>):
  Response | {
    deviceId: string,
    fromDate: Date,
    toDate: Date,
    format: string | null
  } {
  // deviceId is there for legacy reasons
  const deviceId = params.deviceId;
  if (deviceId === undefined)
    return badRequest("Invalid device id specified");

  const url = new URL(request.url);

  const fromDate = parseDateParam(url, "from-date", new Date(new Date().setDate(new Date().getDate() - 2)))
  if (fromDate instanceof Response)
    return fromDate

  const toDate = parseDateParam(url, "to-date", new Date())
  if (toDate instanceof Response)
    return toDate

  const format = parseEnumParam(url, "format", ["json", "geojson"], "json");
  if (format instanceof Response)
    return format

  return {
    deviceId,
    fromDate,
    toDate,
    format
  };
}

function getCsv(meas: Measurement[] | TransformedMeasurement[], delimiter: string): string {
  return convertToCsv(["createdAt", "value"], meas, [
    measurement => measurement.time.toString(),
    measurement => measurement.value?.toString() ?? "null"
  ], delimiter)
}