import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { postNewMeasurements } from "~/lib/measurement-service.server";

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  try {
    const deviceId = params.deviceId;
    if (deviceId === undefined) {
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
    }

    const searchParams = new URL(request.url).searchParams;
    const luftdaten = searchParams.get("luftdaten") !== null;
    const hackair = searchParams.get("hackair") !== null;

    const contentType = request.headers.get("content-type") || "";
    const authorization = request.headers.get("authorization");

    let body: any;
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("text/csv")) {
      body = await request.text();
    } else if (contentType.includes("application/sbx-bytes")) {
      body = await request.arrayBuffer();
    } else {
      body = await request.text();
    }

    await postNewMeasurements(deviceId, body, {
      contentType,
      luftdaten,
      hackair,
      authorization,
    });

    return new Response("Measurements saved in box", {
      status: 201,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: any) {
    // Handle different error types
    if (err.name === "UnauthorizedError") {
      return Response.json(
        {
          code: "Unauthorized",
          message: err.message,
        },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    if (err.name === "UnsupportedMediaTypeError") {
      return Response.json(
        {
          code: "Unsupported Media Type",
          message: err.message,
        },
        {
          status: 415,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    return Response.json(
      {
        code: "Internal Server Error",
        message: err.message || "An unexpected error occurred",
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