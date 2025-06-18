import { type LoaderFunctionArgs } from "react-router";
import { getStatistics } from "~/lib/statistics-service.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const humanParam = url.searchParams.get("human");

    let humanReadable = false;
    if (
      humanParam !== null &&
      humanParam.toLowerCase() !== "true" &&
      humanParam.toLowerCase() !== "false"
    )
      return Response.json(
        {
          error: "Bad Request",
          message:
            "Illegal value for parameter human. allowed values: true, false",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );

    humanReadable = humanParam?.toLowerCase() === "true" || false;

    const stats = await getStatistics(humanReadable);
    return Response.json(stats, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
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
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}
