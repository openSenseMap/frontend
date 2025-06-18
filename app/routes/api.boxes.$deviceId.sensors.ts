import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<Response> => {
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

    return Response.json(
      { code: "Ok", data: { me: jwtResponse } },
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
