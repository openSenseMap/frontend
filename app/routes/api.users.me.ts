import {
  type ActionFunctionArgs,
  type ActionFunction,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { getUserFromJwt, revokeToken } from "~/lib/jwt";
import { deleteUser, updateUserDetails } from "~/lib/user-service.server";
import { verifyLogin } from "~/models/user.server";
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

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const loaderValue = (await loader({
    request,
  } as LoaderFunctionArgs)) as Response;
  if (loaderValue.status !== 200) return loaderValue;

  const user = (await loaderValue.json()).data.me as User;

  switch (request.method) {
    case "PUT":
      return await put(user, request);
    case "DELETE":
      return await del(user, request);
    default:
      return Response.json({ msg: "Method Not Allowed" }, { status: 405 });
  }
};

const put = async (user: User, request: Request): Promise<Response> => {
  const { email, language, name, currentPassword, newPassword } =
    await request.json();
  try {
    const rawAuthorizationHeader = request.headers.get("authorization");
    if (!rawAuthorizationHeader) throw new Error("no_token");
    const [, jwtString] = rawAuthorizationHeader.split(" ");

    const { updated, messages, updatedUser } = await updateUserDetails(
      user,
      jwtString,
      {
        email,
        language,
        name,
        currentPassword,
        newPassword,
      },
    );
    const messageText = messages.join(".");

    if (updated === false) {
      if (messages.length > 0) {
        return Response.json(
          {
            code: "Bad Request",
            message: messageText,
          },
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
      }

      return Response.json(
        {
          code: "Ok",
          message: "No changed properties supplied. User remains unchanged.",
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    return Response.json(
      {
        code: "Ok",
        message: `User successfully saved. ${messageText}`,
        data: { me: updatedUser },
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

const del = async (user: User, r: Request): Promise<Response> => {
  try {
    let formData = new FormData();
    try {
      formData = await r.formData();
    } catch {
      // Just continue, it will fail in the next check
    }

    if (
      !formData.has("password") ||
      formData.get("password")?.toString().length === 0
    )
      return new Response("Bad Request", { status: 400 });

    const rawAuthorizationHeader = r.headers.get("authorization");
    if (!rawAuthorizationHeader) throw new Error("no_token");
    const [, jwtString] = rawAuthorizationHeader.split(" ");

    const deleted = await deleteUser(
      user,
      formData.get("password")!.toString(), // ! operator is fine, we check formData.has above
      jwtString,
    );

    if (deleted === "unauthorized")
      return Response.json(
        { message: "Password incorrect" },
        {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    return Response.json(null, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.warn(err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
