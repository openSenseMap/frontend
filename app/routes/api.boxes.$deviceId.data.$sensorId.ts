import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { TransformedMeasurement, transformOutliers } from "~/lib/outlier-transform";
import { getMeasurements } from "~/models/sensor.server";
import { Measurement } from "~/schema";

/**
 * @openapi
 * /api/boxes/{deviceId}/data/{sensorId}:
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
    // TODO: What do we even need the deviceId for?
    const deviceId = params.deviceId;
    if (deviceId === undefined)
      return Response.json(
        {
          code: "Bad Request",
          message: "Invalid device id specified",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    const sensorId = params.sensorId;
    if (sensorId === undefined)
      return Response.json(
        {
          code: "Bad Request",
          message: "Invalid sensor id specified",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );

    const url = new URL(request.url);

    const outliers = parseEnumParam(url, "outliers", ["replace", "mark"], null)
    if (outliers instanceof Response)
      return outliers;

    const outlierWindowParam = url.searchParams.get("outlier-window")
    let outlierWindow: number = 15;
    if (outlierWindowParam !== null) {
      if (Number.isNaN(outlierWindowParam) || Number(outlierWindowParam) < 1 || Number(outlierWindowParam) > 50)
        return Response.json(
          {
            error: "Bad Request",
            message: "Illegal value for parameter outlier-window. Allowed values: numbers between 1 and 50",
          },
          {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
          },
        );
      outlierWindow = Number(outlierWindowParam);
    }

    const fromDate = parseDateParam(url, "from-date", new Date(new Date().setDate(new Date().getDate() - 2)))
    if (fromDate instanceof Response)
      return fromDate

    const toDate = parseDateParam(url, "to-date", new Date())
    if (toDate instanceof Response)
      return toDate

    // TODO: Actually format output
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

    let meas: Measurement[] | TransformedMeasurement[] = await getMeasurements(sensorId, fromDate.toISOString(), toDate.toISOString());
    if (meas == null)
      return new Response(JSON.stringify({ message: "Device not found." }), {
        status: 404,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    
    if (outliers)
      meas = transformOutliers(meas, outlierWindow, outliers == "replace");

    let headers: HeadersInit = {
        "content-type": format == "json" ? "application/json; charset=utf-8" : "text/csv",
    };
    if (download)
      headers["Content-Disposition"] = `attachment; filename=${sensorId}.${format}`;

    return Response.json(meas, {
      status: 200,
      headers: headers,
    });

  } catch (err) {
    console.warn(err);
    return Response.json(
      {
        error: "Internal Server Error",
        message:
          "The server was unable to complete your request. Please try again later.",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
};

function parseDateParam(url: URL, paramName: string, defaultDate: Date): Response | Date {
  const param = url.searchParams.get(paramName)
  if (param) {
    const date = new Date(param)
    if (Number.isNaN(date.valueOf()))
      return Response.json(
        {
          error: "Bad Request",
          message: `Illegal value for parameter ${paramName}. Allowed values: RFC3339Date`,
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    return date
  }
  return defaultDate;
}

function parseEnumParam(url: URL, paramName: string, allowedValues: string[], defaultValue: string | null): Response | string | null {
  const param = url.searchParams.get(paramName);
  if (param) {
    if (!allowedValues.includes(param))
      return Response.json(
        {
          error: "Bad Request",
          message: `Illegal value for parameter ${paramName}. Allowed values: ${allowedValues}`,
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    return param;
  }
  return defaultValue
}