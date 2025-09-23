import { type ActionFunction, type ActionFunctionArgs } from "react-router";

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: User registration endpoint moved
 *     description: User registration has been moved to /api/users/register. This endpoint provides information about the users resource.
 *     responses:
 *       308:
 *         description: Permanent Redirect - User registration moved to /api/users/register
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registration has been moved to /api/users/register"
 *       405:
 *         description: Method not allowed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const method = request.method;
  
  if (method === "POST") {
    // Redirect to the new registration endpoint
    return new Response(
      JSON.stringify({
        message: "User registration has been moved to /api/users/register"
      }),
      {
        status: 308,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "Location": "/api/users/register"
        },
      }
    );
  }
  
  return new Response("Method not allowed", { status: 405 });
};