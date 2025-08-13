import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { getDevice } from "~/models/device.server";
import { user } from "~/schema";

export const loader: LoaderFunction = async ({
  request,
  params,
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
    const user = jwtResponse;

    const deviceId = params.deviceId;
    if (deviceId === undefined)
      return Response.json(
        {
          code: "Bad Request",
          message: "Invalid device id specified",
        },
        {
          status: 400,
        },
      );

    const box = await getDevice({ id: deviceId });
    if (box === undefined)
      return Response.json(
        {
          code: "Bad Request",
          message: "There is no such device with the given id",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    if (box.user.id !== user.id)
      return Response.json(
        { code: "Forbidden", message: "User does not own this senseBox" },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    return Response.json(
      { code: "Ok", data: { box: box } },
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
