import {
  unstable_createContext,
  type unstable_MiddlewareFunction,
} from "react-router";
import { getUserFromJwt } from "./jwt";
import { type User } from "~/schema";

/**
 * Adds JSON response headers to a request
 */
export const jsonResponseHeaders: unstable_MiddlewareFunction<
  Response
> = async (args, next) => {
  const response = await next();
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  return response;
};

/**
 * Context for routes that need authorization/ authentication
 */
export const authContext = unstable_createContext<User>();

/**
 * Checks a request for authentication/ authorization
 * via jwt and sets the {@link authContext}
 * to contain the user object
 */
export const jwtAuth: unstable_MiddlewareFunction<Response> = async ({
  request,
  context,
}) => {
  const jwtResponse = await getUserFromJwt(request);
  if (typeof jwtResponse === "string")
    return Response.json(
      {
        code: "Forbidden",
        message: "Invalid JWT authorization. Please sign in to obtain new JWT.",
      },
      {
        status: 403,
      },
    );

  context.set(authContext, jwtResponse);
};
