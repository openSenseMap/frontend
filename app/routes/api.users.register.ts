import { redirect, type ActionFunctionArgs } from "react-router";

/**
 * Following REST, registration is the creation of a new user resource,
 * hence we are forwarding the request to the new /users route.
 */
export async function action({}: ActionFunctionArgs) {
  const USER_ROUTE = "/api/users";
  return redirect(USER_ROUTE, {
    status: 308, // Permanent Redirect
  });
}
