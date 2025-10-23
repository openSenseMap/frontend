import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getLatestMeasurements } from "~/lib/measurement-service.server";

/**
 * @openapi
 * /api/boxes/{deviceId}/sensors:
 *  get:
 *    tags:
 *      - Sensors
 *    summary: Get the latest measurements of all sensors of the specified senseBox.
 *    parameters:
 *      - in: path
 *        name: deviceId
 *        required: true
 *        schema:
 *          type: string
 *        description: the ID of the senseBox you are referring to
 *      - in: query
 *        name: count
 *        required: false
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 100
 *        description: Number of measurements to be retrieved for every sensor
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

    const url = new URL(request.url);
    const countParam = url.searchParams.get("count");

    let count: undefined | number = undefined;
    if (countParam !== null && Number.isNaN(countParam))
      return Response.json(
        {
          error: "Bad Request",
          message: "Illegal value for parameter count. allowed values: numbers",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    count = countParam === null ? undefined : Number(countParam);

    const meas = await getLatestMeasurements(deviceId, count);

    return Response.json(meas, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
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
