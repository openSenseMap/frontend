import {
  type ActionFunctionArgs,
  type ActionFunction,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { deleteUser, updateUserDetails } from "~/lib/user-service.server";
import { type User } from "~/schema/user";

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get current user information
 *     description: Retrieves the current authenticated user's information from JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Ok"
 *                 data:
 *                   type: object
 *                   properties:
 *                     me:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               code: "Ok"
 *               data:
 *                 me:
 *                   id: "user_123456"
 *                   username: "john_doe"
 *                   email: "john.doe@example.com"
 *                   language: "en_US"
 *       403:
 *         description: Forbidden - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Invalid JWT authorization. Please sign in to obtain new JWT."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "The server was unable to complete your request. Please try again later."
 *   put:
 *     tags:
 *       - User Management
 *     summary: Update user details
 *     description: Updates the current authenticated user's information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email address
 *                 example: "newemail@example.com"
 *               language:
 *                 type: string
 *                 description: Preferred language
 *                 enum:
 *                   - "de_DE"
 *                   - "en_US"
 *                 example: "en_US"
 *               name:
 *                 type: string
 *                 description: New username
 *                 example: "new_username"
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password (required for password change)
 *                 example: "currentPassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *                 example: "newPassword123"
 *           example:
 *             email: "updated@example.com"
 *             language: "de_DE"
 *             name: "updated_username"
 *     responses:
 *       200:
 *         description: User successfully updated or no changes made
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Ok"
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     me:
 *                       $ref: '#/components/schemas/User'
 *             examples:
 *               updated:
 *                 summary: User successfully updated
 *                 value:
 *                   code: "Ok"
 *                   message: "User successfully saved. Email updated."
 *                   data:
 *                     me:
 *                       id: "user_123456"
 *                       username: "updated_username"
 *                       email: "updated@example.com"
 *                       language: "de_DE"
 *               noChanges:
 *                 summary: No changes made
 *                 value:
 *                   code: "Ok"
 *                   message: "No changed properties supplied. User remains unchanged."
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Validation error message"
 *       403:
 *         description: Forbidden - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Invalid JWT authorization. Please sign in to obtain new JWT."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "The server was unable to complete your request. Please try again later."
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Delete user account
 *     description: Permanently deletes the current authenticated user's account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Current password for confirmation
 *                 example: "currentPassword123"
 *     responses:
 *       200:
 *         description: User account successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: "null"
 *             example: null
 *       400:
 *         description: Bad request - password missing or empty
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Bad Request"
 *       401:
 *         description: Unauthorized - incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password incorrect"
 *       403:
 *         description: Forbidden - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Invalid JWT authorization. Please sign in to obtain new JWT."
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Method Not Allowed"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login/registration
 *   schemas:
 *     User:
 *       type: object
 *       description: User object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *           example: "user_123456"
 *         username:
 *           type: string
 *           description: User's chosen username
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         language:
 *           type: string
 *           description: User's preferred language
 *           enum:
 *             - "de_DE"
 *             - "en_US"
 *           example: "en_US"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *           example: "2025-06-18T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was last updated
 *           example: "2025-06-18T10:30:00Z"
 *       required:
 *         - id
 *         - username
 *         - email
 *         - language
 */

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
