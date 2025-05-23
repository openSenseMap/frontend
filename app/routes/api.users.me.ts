import {
  type ActionFunctionArgs,
  type ActionFunction,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { type User } from "~/schema/user";

export const loader: LoaderFunction = async ({
  request,
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

    return Response.json(
      { code: "Ok", data: { me: jwtResponse } },
      { status: 200 },
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

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const loaderValue = (await loader({
    request,
  } as LoaderFunctionArgs)) as Response;
  if (loaderValue.status !== 200) return loaderValue;

  const user = (await loaderValue.json()).data.me as User;

  switch (request.method) {
    case "POST":
      return await post();
    case "PUT":
      return await put();
    case "DELETE":
      return await del();
    default:
      return Response.json({ msg: "Method Not Allowed" }, { status: 405 });
  }
};

const post = async () => {};
const put = async () => {};
const del = async () => {};
