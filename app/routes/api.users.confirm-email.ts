import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { confirmEmail } from "~/lib/user-service.server";

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
      { message: "No email confirmation token specified." },
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    );

  if (
    !formData.has("email") ||
    formData.get("email")?.toString().trim().length === 0
  )
    return Response.json(
      { message: "No email address to confirm specified." },
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    );

  try {
    const updatedUser = await confirmEmail(
      formData.get("token")!.toString(),
      formData.get("email")!.toString(),
    );

    if (updatedUser === null)
      return Response.json(
        {
          code: "Forbidden",
          message: "Invalid or expired confirmation token.",
        },
        {
          status: 403,
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      );

    return Response.json(
      {
        code: "Ok",
        message: "E-Mail successfully confirmed. Thank you",
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (err) {
    console.warn(err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
