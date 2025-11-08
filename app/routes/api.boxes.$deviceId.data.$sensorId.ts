import { type Params, type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { type TransformedMeasurement, transformOutliers } from "~/lib/outlier-transform";
import { getMeasurements } from "~/models/sensor.server";
import { type Measurement } from "~/schema";
import { convertToCsv } from "~/utils/csv";
import { parseDateParam, parseEnumParam } from "~/utils/param-utils";
import { badRequest, internalServerError, notFound } from "~/utils/response-utils";

/**
 * @openapi
 * /boxes/{deviceId}/data/{sensorId}:
 *   get:
 *    tags:
 *      - Sensors
 *    summary: Get up to 10000 measurements from a sensor for a specific time frame
 *    description: Get up to 10000 measurements from a sensor for a specific time frame, parameters `from-date` and `to-date` are optional. If not set, the last 48 hours are used. The maximum time frame is 1 month. If `download=true` `Content-disposition` headers will be set. Allows for JSON or CSV format.
 *    parameters:
 *      - in: path
 *        name: deviceId
 *        required: true
 *        schema:
 *          type: string
 *        description: the ID of the senseBox you are referring to
 *      - in: path
 *        name: sensorId
 *        required: true
 *        schema:
 *          type: string
 *        description: the ID of the sensor you are referring to
 *      - in: query
 *        name: outliers
 *        required: false
 *        schema:
 *          type: string
 *          enum:
 *            - replace
 *            - mark
 *        description: Specifying this parameter enables outlier calculation which adds a new field called `isOutlier` to the data. Possible values are "mark" and "replace".
 *      - in: query
 *        name: outlier-window
 *        required: false
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 50
 *          default: 15
 *        description: Size of moving window used as base to calculate the outliers.
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
 *            - csv
 *          default: json
 *        description: "Can be 'json' (default) or 'csv' (default: json)"
 *      - in: query
 *        name: download
 *        required: false
 *        schema:
 *          type: boolean
 *        description: if specified, the api will set the `content-disposition` header thus forcing browsers to download instead of displaying. Is always true for format csv.
 *      - in: query
 *        name: delimiter
 *        required: false
 *        schema:
 *          type: string
 *          enum:
 *            - comma
 *            - semicolon
 *          default: comma
 *        description: "Only for csv: the delimiter for csv. Possible values: `semicolon`, `comma`. Per default a comma is used. Alternatively you can use separator as parameter name."
 *    responses:
 *       200:
 *         description: Success
 *         content:
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
    const {deviceId, sensorId, outliers, outlierWindow, fromDate, toDate, format, download, delimiter} = collected;

    let meas: Measurement[] | TransformedMeasurement[] = await getMeasurements(sensorId, fromDate.toISOString(), toDate.toISOString());
    if (meas == null)
      return notFound("Device not found.");
    
    if (outliers)
      meas = transformOutliers(meas, outlierWindow, outliers == "replace");

    let headers: HeadersInit = {
        "content-type": format == "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
    };
    if (download)
      headers["Content-Disposition"] = `attachment; filename=${sensorId}.${format}`;

    let responseInit: ResponseInit = {
      status: 200,
      headers: headers,
    };

    if (format == "json")
      return Response.json(meas, responseInit);
    else {
      const csv = getCsv(meas, delimiter == "comma" ? "," : ";");
      return new Response(csv, responseInit)
    }

  } catch (err) {
    console.warn(err);
    return internalServerError();
  }
};

function collectParameters(request: Request, params: Params<string>):
  Response | {
    deviceId: string,
    sensorId: string,
    outliers: string | null,
    outlierWindow: number,
    fromDate: Date,
    toDate: Date,
    format: string | null,
    download: boolean | null,
    delimiter: string
  } {
  // deviceId is there for legacy reasons
  const deviceId = params.deviceId;
  if (deviceId === undefined)
    return badRequest("Invalid device id specified");
  const sensorId = params.sensorId;
  if (sensorId === undefined)
    return badRequest("Invalid sensor id specified");

  const url = new URL(request.url);

  const outliers = parseEnumParam(url, "outliers", ["replace", "mark"], null)
  if (outliers instanceof Response)
    return outliers;

  const outlierWindowParam = url.searchParams.get("outlier-window")
  let outlierWindow: number = 15;
  if (outlierWindowParam !== null) {
    if (Number.isNaN(outlierWindowParam) || Number(outlierWindowParam) < 1 || Number(outlierWindowParam) > 50)
      return badRequest("Illegal value for parameter outlier-window. Allowed values: numbers between 1 and 50");
    outlierWindow = Number(outlierWindowParam);
  }

  const fromDate = parseDateParam(url, "from-date", new Date(new Date().setDate(new Date().getDate() - 2)))
  if (fromDate instanceof Response)
    return fromDate

  const toDate = parseDateParam(url, "to-date", new Date())
  if (toDate instanceof Response)
    return toDate

  const format = parseEnumParam(url, "format", ["json", "csv"], "json");
  if (format instanceof Response)
    return format

  const downloadParam = parseEnumParam(url, "download", ["true", "false"], null)
  if (downloadParam instanceof Response)
    return downloadParam
  const download = downloadParam == null
    ? null
    : (downloadParam === "true");

  const delimiter = parseEnumParam(url, "delimiter", ["comma", "semicolon"], "comma");
  if (delimiter instanceof Response)
    return delimiter;

  return {
    deviceId,
    sensorId,
    outliers,
    outlierWindow,
    fromDate,
    toDate,
    format,
    download,
    delimiter
  };
}

function getCsv(meas: Measurement[] | TransformedMeasurement[], delimiter: string): string {
  return convertToCsv(["createdAt", "value"], meas, [
    measurement => measurement.time.toString(),
    measurement => measurement.value?.toString() ?? "null"
  ], delimiter)
}