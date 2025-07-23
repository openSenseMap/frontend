import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getLatestMeasurements } from "~/lib/measurement-service.server";

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

    const meas = await getLatestMeasurements(deviceId, sensorId, undefined);

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
