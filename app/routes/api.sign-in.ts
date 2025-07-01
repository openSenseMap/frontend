import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { signIn } from "~/lib/user-service.server";
/**
 * @openapi
 * /api/sign-in:
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
 *                 minLength: 1
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
  let formData = new FormData();
  try {
    formData = await request.formData();
  } catch {
    // Just continue, it will fail in the next check
    // The try catch block handles an exception that occurs if the
    // request was sent without x-www-form-urlencoded content-type header
  }

  if (
    !formData.has("email") ||
    formData.get("email")?.toString().trim().length === 0
  )
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

  if (
    !formData.has("password") ||
    formData.get("password")?.toString().trim().length === 0
  )
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

  try {
    const { user, jwt, refreshToken } =
      (await signIn(
        formData.get("email")!.toString(),
        formData.get("password")!.toString(),
      )) || {};

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
  } catch (err) {
    console.warn(err);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
};
