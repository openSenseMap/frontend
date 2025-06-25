import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { signIn } from "~/lib/user-service.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  let formData = new FormData();
  try {
    formData = await request.formData();
  } catch {
    // Just continue, it will fail in the next check
    // The try catch block handles an exception that occurs if the
    // request was sent without x-www-form-urlencoded content-type header
  }

  if (
    !formData.has("email") ||
    formData.get("email")?.toString().trim().length === 0
  )
    return Response.json(
      {
        code: "Unauthorized",
        message: "You must specify either your email or your username",
      },
      {
        status: 403,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );

  if (
    !formData.has("password") ||
    formData.get("password")?.toString().trim().length === 0
  )
    return Response.json(
      {
        code: "Unauthorized",
        message: "You must specify your password to sign in",
      },
      {
        status: 403,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );

  try {
    const { user, jwt, refreshToken } =
      (await signIn(
        formData.get("email")!.toString(),
        formData.get("password")!.toString(),
      )) || {};

    if (user && jwt && refreshToken)
      return Response.json(
        {
          code: "Authorized",
          message: "Successfully signed in",
          data: { user },
          token: jwt,
          refreshToken,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    else
      return Response.json(
        { code: "Unauthorized", message: "User and or password not valid!" },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
  } catch (err) {
    console.warn(err);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
};
