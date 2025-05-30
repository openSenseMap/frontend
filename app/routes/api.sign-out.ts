import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { getUserFromJwt, revokeToken } from "~/lib/jwt";
import { type User } from "~/schema";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
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
    await revokeToken(user, jwtString);
    return Response.json(
      { code: "Ok", message: "Successfully signed out" },
      {
        status: 200,
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
