import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<Response> => {
  return Response.json({}, { status: 200 });
};
