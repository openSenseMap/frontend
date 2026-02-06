import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { resetPassword } from "~/lib/user-service.server";
import { StandardResponse } from "~/utils/response-utils";

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
    !formData.has("password") ||
    formData.get("password")?.toString().trim().length === 0
  )
  return StandardResponse.badRequest("No new password specified.");

  if (
    !formData.has("token") ||
    formData.get("token")?.toString().trim().length === 0
  )
  return StandardResponse.badRequest("No password reset token specified.");

  try {
    const resetStatus = await resetPassword(
      formData.get("token")!.toString(),
      formData.get("password")!.toString(),
    );

    switch (resetStatus) {
      case "forbidden":
      case "expired":
        return StandardResponse.forbidden(resetStatus === "forbidden"
                ? "Password reset for this user not possible"
                : "Password reset token expired");
      case "invalid_password_format":
        return StandardResponse.badRequest("Password must be at least ${password_min_length} characters.");
      case "success":
        return StandardResponse.ok({
            code: "Ok",
            message:
              "Password successfully changed. You can now login with your new password",
          });
    }
  } catch (err) {
    console.warn(err);
    return StandardResponse.internalServerError();
  }
};
