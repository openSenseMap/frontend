import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { postSingleMeasurement } from "~/lib/measurement-service.server";

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  try {
    const { deviceId, sensorId } = params;
    
    if (!deviceId || !sensorId) {
      return Response.json(
        {
          code: "Bad Request",
          message: "Invalid device id or sensor id specified",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          code: "Unsupported Media Type",
          message: "Content-Type must be application/json",
        },
        {
          status: 415,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    const body = await request.json();

    await postSingleMeasurement(deviceId, sensorId, body, authorization);

    return new Response("Measurement saved in box", {
      status: 201,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: any) {
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

    if (err.name === "NotFoundError") {
      return Response.json(
        {
          code: "Not Found",
          message: err.message,
        },
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    if (err.name === "UnprocessableEntityError" || err.type === "UnprocessableEntityError") {
      return Response.json(
        {
          code: "Unprocessable Entity",
          message: err.message,
        },
        {
          status: 422,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    if (err.name === "ModelError" && err.type === "UnprocessableEntityError") {
      return Response.json(
        {
          code: "Unprocessable Entity",
          message: err.message,
        },
        {
          status: 422,
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