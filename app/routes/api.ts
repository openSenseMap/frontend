import { type LoaderFunctionArgs } from "react-router";

export async function loader({ }: LoaderFunctionArgs) {
  return new Response("openSenseMap API", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
