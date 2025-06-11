import { type LoaderFunctionArgs } from "react-router";

export async function loader({}: LoaderFunctionArgs) {
  return new Response("stats", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
