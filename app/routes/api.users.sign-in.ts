import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { signIn } from "~/lib/user-service.server";
import { parseUserSignInData } from "~/lib/request-parsing";
/**
 * @openapi
 * /api/users/sign-in:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User sign-in
 *     description: Authenticates a user with email and password credentials
 *     operationId: signInUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 minLength: 8
 *                 example: mySecurePassword123
 *     responses:
 *       200:
 *         description: Successfully authenticated
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
 *                   example: Successfully signed in
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       403:
 *         description: Authentication failed - invalid credentials or missing fields
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
 *                     - You must specify either your email or your username
 *                     - You must specify your password to sign in
 *                     - User and or password not valid!
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
    const data = await parseUserSignInData(request);
    
    const email = data.email.trim();
    const password = data.password.trim();

    if (!email || email.length === 0) {
      return Response.json(
        {
          code: "Unauthorized",
          message: "You must specify either your email or your username",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    if (!password || password.length === 0) {
      return Response.json(
        {
          code: "Unauthorized",
          message: "You must specify your password to sign in",
        },
        {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    const { user, jwt, refreshToken } = (await signIn(email, password)) || {};

    if (user && jwt && refreshToken)
      return Response.json(
        {
          code: "Authorized",
          message: "Successfully signed in",
          data: { user },
          token: jwt,
          refreshToken,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    else
      return Response.json(
        { code: "Unauthorized", message: "User and or password not valid!" },
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
