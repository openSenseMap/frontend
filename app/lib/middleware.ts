import { type unstable_MiddlewareFunction } from "react-router";

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
