import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { getUserDevices } from "~/models/device.server";
import { transformDeviceToApiFormat } from "~/lib/device-transform";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  try {
    const jwtResponse = await getUserFromJwt(request);

    if (typeof jwtResponse === "string")
      return Response.json(
        {
          code: "Forbidden",
          message:
            "Invalid JWT authorization. Please sign in to obtain new JWT.",
        },
        {
          status: 403,
        },
      );

    const userBoxes = await getUserDevices(jwtResponse.id);
    const cleanedBoxes = userBoxes.map(transformDeviceToApiFormat);

    return Response.json(
      {
        code: "Ok",
        data: {
          boxes: cleanedBoxes,
          boxes_count: cleanedBoxes.length,
          sharedBoxes: [],
        },
      },
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
      },
    );
  }
};
