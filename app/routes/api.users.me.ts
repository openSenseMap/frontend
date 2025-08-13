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
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     operationId: getCurrentUser
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Ok
 *                 data:
 *                   type: object
 *                   properties:
 *                     me:
 *                       $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Forbidden
 *                 message:
 *                   type: string
 *                   example: Invalid JWT authorization. Please sign in to obtain new JWT.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: The server was unable to complete your request. Please try again later.
 *   put:
 *     tags:
 *       - User Management
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     operationId: updateUserProfile
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
 *                 example: newemail@example.com
 *               language:
 *                 type: string
 *                 description: Preferred language setting
 *                 example: en
 *               name:
 *                 type: string
 *                 description: User's display name
 *                 example: John Doe
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password (required for password change)
 *                 example: currentPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *                 example: newPassword456
 *     responses:
 *       200:
 *         description: User profile updated successfully or no changes made
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Profile updated successfully
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: Ok
 *                     message:
 *                       type: string
 *                       example: User successfully saved. Password updated.
 *                     data:
 *                       type: object
 *                       properties:
 *                         me:
 *                           $ref: '#/components/schemas/User'
 *                 - type: object
 *                   description: No changes made
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: Ok
 *                     message:
 *                       type: string
 *                       example: No changed properties supplied. User remains unchanged.
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Current password is incorrect
 *       403:
 *         description: Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Delete user account
 *     description: Permanently deletes the authenticated user's account
 *     operationId: deleteUserAccount
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
 *                 description: Current password for account deletion confirmation
 *                 example: myCurrentPassword123
 *     responses:
 *       200:
 *         description: Account successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: "null"
 *               description: Empty response indicating successful deletion
 *       400:
 *         description: Bad request - missing password
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Bad Request
 *       401:
 *         description: Unauthorized - incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password incorrect
 *       403:
 *         description: Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Internal Server Error
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from sign-in endpoint
 *   schemas:
 *     User:
 *       type: object
 *       description: User profile information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *           example: user_123456
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         name:
 *           type: string
 *           description: User's display name
 *           example: John Doe
 *         language:
 *           type: string
 *           description: User's preferred language
 *           example: en
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: 2024-01-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last account update timestamp
 *           example: 2024-01-20T14:45:00Z
 *     ForbiddenError:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: Forbidden
 *         message:
 *           type: string
 *           example: Invalid JWT authorization. Please sign in to obtain new JWT.
 *     InternalServerError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Internal Server Error
 *         message:
 *           type: string
 *           example: The server was unable to complete your request. Please try again later.
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
