import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getLatestMeasurementsForSensor } from "~/lib/measurement-service.server";
import { StandardResponse } from "~/utils/response-utils";

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<Response> => {
  try {
    const deviceId = params.deviceId;
    if (deviceId === undefined)
      return StandardResponse.badRequest("Invalid device id specified");

    const sensorId = params.sensorId;
    if (sensorId === undefined)
      return StandardResponse.badRequest("Invalid sensor id specified");

    const searchParams = new URL(request.url).searchParams;
    const onlyValue =
      (searchParams.get("onlyValue")?.toLowerCase() ?? "") === "true";
    if (sensorId === undefined && onlyValue)
      return StandardResponse.badRequest("onlyValue can only be used when a sensor id is specified");

    const meas = await getLatestMeasurementsForSensor(deviceId, sensorId, undefined);

    if (meas == null)
      return StandardResponse.notFound("Device not found.");

    if (onlyValue)
      return StandardResponse.ok(meas["lastMeasurement"]?.value ?? null);

    return StandardResponse.ok({ ...meas, _id: meas.id } /* for legacy purposes */);
  } catch (err) {
    console.warn(err);
    return StandardResponse.internalServerError();
  }
};
