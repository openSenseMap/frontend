import { type unstable_MiddlewareFunction } from "react-router";
import { type Route } from "./+types/api.users.me.boxes";
import { authContext, jsonResponseHeaders, jwtAuth } from "~/lib/middleware";
import { getUserDevices } from "~/models/device.server";

export const loader = async ({ context }: Route.LoaderArgs) => {
  try {
    const user = context.get(authContext);
    const userBoxes = await getUserDevices(user.id);

    return Response.json(
      {
        code: "Ok",
        data: {
          boxes: userBoxes,
          boxes_count: userBoxes.length,
          sharedBoxes: [],
        },
      },
      {
        status: 200,
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

export const unstable_middleware: unstable_MiddlewareFunction<Response>[] = [
  jsonResponseHeaders,
  jwtAuth,
];
