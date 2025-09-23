import { type ActionFunction, type ActionFunctionArgs } from "react-router";
import { createToken } from "~/lib/jwt";
import {
  type EmailValidation,
  type PasswordValidation,
  type UsernameValidation,
} from "~/lib/user-service";
import { registerUser } from "~/lib/user-service.server";
import { parseUserRegistrationData } from "~/lib/helpers";
import { type User } from "~/schema";

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account with username, email, password, and language preference
 *     operationId: registerUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Username for the new account
 *                 minLength: 3
 *                 maxLength: 40
 *                 pattern: '^[a-zA-Z0-9][a-zA-Z0-9._\- ]*$'
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for the new account
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the new account
 *                 minLength: 8
 *                 example: "mySecurePassword123"
 *               language:
 *                 type: string
 *                 description: Preferred language for the user
 *                 enum:
 *                   - "de_DE"
 *                   - "en_US"
 *                 default: "en_US"
 *                 example: "en_US"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully registered new user"
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               message: "Successfully registered new user"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               data:
 *                 id: "user_123456"
 *                 username: "john_doe"
 *                 email: "john.doe@example.com"
 *                 language: "en_US"
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               userExists:
 *                 summary: User already exists
 *                 value:
 *                   message: "User already exists."
 *               usernameRequired:
 *                 summary: Username validation failed
 *                 value:
 *                   message: "Username is required."
 *               emailInvalid:
 *                 summary: Email validation failed
 *                 value:
 *                   message: "Invalid email format."
 *               passwordTooShort:
 *                 summary: Password validation failed
 *                 value:
 *                   message: "Password must be at least 8 characters long."
 *       405:
 *         description: Method not allowed - only POST requests are accepted
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Unable to create jwt for newly created user: Token generation failed"
 *           text/plain:
 *             schema:
 *               type: string
 *             example: "Internal Server Error"
 * 
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: User object returned after successful registration
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

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const method = request.method;
  if (method !== "POST") return new Response(null, { status: 405 });

  try {
    // Parse request data - handles both JSON and form data automatically
    const data = await parseUserRegistrationData(request);
    
    const username = data.name;
    const email = data.email;
    const password = data.password;
    const language = data.language as "de_DE" | "en_US";
    const registration = await registerUser(
      username,
      email,
      password,
      language,
    );
    if (!registration)
      // null is returned when no new user profile was created because it already exists
      return new Response(JSON.stringify({ message: "User already exists." }), {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });

    if ("validationKind" in registration) {
      // A validation was returned, therefore a bad request was sent in
      let msg = "Bad Request";
      switch (registration.validationKind) {
        case "username":
          const usernameValidation = registration as UsernameValidation;
          if (usernameValidation.required) msg = "Username is required.";
          if (usernameValidation.length)
            msg =
              "Username must be at least 3 characters long and not more than 40.";
          if (usernameValidation.invalidCharacters)
            msg =
              "Username may only contain alphanumerics (a-zA-Z0-9), dots (.), dashes (-), underscores (_) and spaces, and has to start with either a number or a letter.";
          break;
        case "email":
          const emailValidation = registration as EmailValidation;
          if (emailValidation.required) msg = "Email is required.";
          if (emailValidation.format) msg = "Invalid email format.";
          break;
        case "password":
          const passwordValidation = registration as PasswordValidation;
          if (passwordValidation.required) msg = "Password is required.";
          if (passwordValidation.length)
            msg = "Password must be at least 8 characters long.";
          break;
      }
      return new Response(JSON.stringify({ message: msg }), {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    const user = registration as User;

    try {
      const { token, refreshToken } = await createToken(user);

      return new Response(
        JSON.stringify({
          message: "Successfully registered new user",
          token: token,
          refreshToken: refreshToken,
          data: user,
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      );
    } catch (err) {
      console.error("Unable to create JWT", err);
      return new Response(
        JSON.stringify({
          message: `Unable to create jwt for newly created user: ${(err as Error)?.message}`,
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      );
    }
  } catch (error) {
    // Handle parsing errors
    if (error instanceof Error && error.message.includes('Failed to parse')) {
      return new Response(
        JSON.stringify({ 
          message: `Invalid request format: ${error.message}` 
        }),
        {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }
    
    // Handle other errors
    console.error("Registration error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
