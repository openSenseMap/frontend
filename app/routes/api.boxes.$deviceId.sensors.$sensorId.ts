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

    const searchParams = new URL(request.url).searchParams;
    const onlyValue =
      (searchParams.get("onlyValue")?.toLowerCase() ?? "") === "true";
    if (sensorId === undefined && onlyValue)
      return Response.json(
        {
          code: "Bad Request",
          message: "onlyValue can only be used when a sensor id is specified",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );

    const meas = await getLatestMeasurements(deviceId, sensorId, undefined);

    if (onlyValue)
      return Response.json(meas.lastMeasurement.value, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });

    return Response.json(
      { ...meas, _id: meas.id }, // for legacy purposes
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
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
