import type { ActionFunction, ActionFunctionArgs } from "react-router";
import { parseRefreshTokenData } from "~/lib/helpers";
import { getUserFromJwt, hashJwt, refreshJwt } from "~/lib/jwt";
import type { User } from "~/schema";

/**
 * @openapi
 * /api/users/refresh-auth:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh authentication token
 *     description: Refreshes a JWT access token using a valid refresh token
 *     operationId: refreshAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Successfully refreshed authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Authorized
 *                 message:
 *                   type: string
 *                   example: Successfully refreshed auth
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT refresh token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       403:
 *         description: Authentication failed - invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   enum:
 *                     - You must specify a token to refresh
 *                     - Refresh token invalid or too old. Please sign in with your username and password.
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Internal Server Error
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: User information object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         name:
 *           type: string
 *           description: User's display name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last account update timestamp
 */

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  try {
    // Parse request data - handles both JSON and form data automatically
    const data = await parseRefreshTokenData(request);
    
    if (!data.token || data.token.trim().length === 0) {
      return Response.json(
        {
          code: "Unauthorized",
          message: "You must specify a token to refresh",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    // We deliberately make casts and stuff like that, so everything
    // but the happy path will result in an internal server error.
    // This is done s.t. we are not leaking information if someone
    // tries sending random token to see if users exist or similar
    const user = (await getUserFromJwt(request)) as User;
    const rawAuthorizationHeader = request.headers
      .get("authorization")!
      .toString();
    const [, jwtString = ""] = rawAuthorizationHeader.split(" ");

    if (data.token !== hashJwt(jwtString))
      return Response.json(
        {
          code: "Unauthorized",
          message:
            "Refresh token invalid or too old. Please sign in with your username and password.",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );

    const { token, refreshToken } =
      (await refreshJwt(user, data.token)) || {};

    if (token && refreshToken)
      return Response.json(
        {
          code: "Authorized",
          message: "Successfully refreshed auth",
          data: { user },
          token,
          refreshToken,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    else
      return Response.json(
        {
          code: "Unauthorized",
          message:
            "Refresh token invalid or too old. Please sign in with your username and password.",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
  } catch (error) {
    // Handle parsing errors
    if (error instanceof Error && error.message.includes('Failed to parse')) {
      return Response.json(
        {
          code: "Unauthorized",
          message: `Invalid request format: ${error.message}`,
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }
    
    // Handle other errors
    console.warn(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
};
