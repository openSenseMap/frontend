import { type LoaderFunctionArgs } from "react-router";
import { getTags } from "~/lib/device-service.server";

export async function loader({}: LoaderFunctionArgs) {
  try {
    const tags = await getTags();
    return Response.json(
      {
        code: "Ok",
        data: tags,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (e) {
    console.warn(e);
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
}
