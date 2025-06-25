import { ActionFunction, ActionFunctionArgs } from "react-router";
import { getUserFromJwt, hashJwt, refreshJwt, revokeToken } from "~/lib/jwt";
import { User, refreshToken } from "~/schema";

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
    !formData.has("token") ||
    formData.get("token")?.toString().trim().length === 0
  )
    return Response.json(
      {
        code: "Unauthorized",
        message: "You must specify a token to refresh",
      },
      {
        status: 403,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );

  try {
    // We deliberately make casts and stuff like that, so everything
    // but the happy path will result in an internal server error.
    // This is done s.t. we are not leaking information if someone
    // tries sending random token to see if users exist or similar
    const user = (await getUserFromJwt(request)) as User;
    const rawAuthorizationHeader = request.headers
      .get("authorization")!
      .toString();
    const [, jwtString = ""] = rawAuthorizationHeader.split(" ");

    if (formData.get("token")!.toString() !== hashJwt(jwtString))
      return Response.json(
        {
          code: "Unauthorized",
          message:
            "Refresh token invalid or too old. Please sign in with your username and password.",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    const { token, refreshToken } =
      (await refreshJwt(user, formData.get("token")!.toString())) || {};

    if (token && refreshToken)
      return Response.json(
        {
          code: "Authorized",
          message: "Successfully refreshed auth",
          data: { user },
          token,
          refreshToken,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    else
      return Response.json(
        {
          code: "Unauthorized",
          message:
            "Refresh token invalid or too old. Please sign in with your username and password.",
        },
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
