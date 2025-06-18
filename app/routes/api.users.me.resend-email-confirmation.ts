import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { resendEmailConfirmation } from "~/lib/user-service.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
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

    const result = await resendEmailConfirmation(jwtResponse);
    if (result === "already_confirmed")
      return Response.json(
        {
          code: "Unprocessable Content",
          message: `Email address ${jwtResponse.email} is already confirmed.`,
        },
        {
          status: 422,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    return Response.json(
      {
        code: "Ok",
        message: `Email confirmation has been sent to ${result.unconfirmedEmail}`,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
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
