import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { resendEmailConfirmation } from "~/lib/user-service.server";
import { type User } from "~/schema";
import { StandardResponse } from "~/utils/response-utils";
import { getUser } from "~/utils/session.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  try {
    const jwtResponse = await getUser(request) as User;
    
    if (typeof jwtResponse === "string")
      return StandardResponse.forbidden("Invalid JWT authorization. Please sign in to obtain new JWT.");

    const result = await resendEmailConfirmation(jwtResponse);
    if (result === "already_confirmed")
      return StandardResponse.unprocessableContent(`Email address ${jwtResponse.email} is already confirmed.`);

    return StandardResponse.ok({
        code: "Ok",
        message: `Email confirmation has been sent to ${result.unconfirmedEmail}`,
      });
  } catch (err) {
    console.warn(err);
    return StandardResponse.internalServerError();
  }
};
