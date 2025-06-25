import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { resetPassword } from "~/lib/user-service.server";

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
    return Response.json(
      { message: "No new password specified." },
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    );

  if (
    !formData.has("token") ||
    formData.get("token")?.toString().trim().length === 0
  )
    return Response.json(
      { message: "No password reset token specified." },
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    );

  try {
    const resetStatus = await resetPassword(
      formData.get("token")!.toString(),
      formData.get("password")!.toString(),
    );

    switch (resetStatus) {
      case "forbidden":
      case "expired":
        return Response.json(
          {
            code: "Forbidden",
            message:
              resetStatus === "forbidden"
                ? "Password reset for this user not possible"
                : "Password reset token expired",
          },
          {
            status: 403,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
      case "invalid_password_format":
        return Response.json(
          {
            code: "Bad Request",
            message:
              "Password must be at least ${password_min_length} characters.",
          },
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
      case "success":
        return Response.json(
          {
            code: "Ok",
            message:
              "Password successfully changed. You can now login with your new password",
          },
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
    }
  } catch (err) {
    console.warn(err);
    return Response.json("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
};
